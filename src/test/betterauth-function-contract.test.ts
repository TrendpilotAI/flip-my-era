/**
 * BetterAuth boundary contract tests.
 *
 * These tests inspect only source/configuration boundaries that a browser can
 * reach. Runtime Edge/DB behavior belongs in the Deno and pgTAP suites.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(process.cwd());

interface BetterAuthGatewayManifest {
  readonly gatewayFunctions: readonly string[];
}

interface DirectFunctionInvocation {
  readonly endpoint: string;
  readonly relativePath: string;
  readonly line: number;
}

interface ParsedSource {
  readonly text: string;
  readonly file: ts.SourceFile;
}

function absolutePath(relativePath: string): string {
  return resolve(repoRoot, relativePath);
}

function parseSource(relativePath: string): ParsedSource {
  const path = absolutePath(relativePath);
  const text = readFileSync(path, 'utf8');
  const scriptKind = relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return {
    text,
    file: ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, scriptKind),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
}

function hasImportFrom(source: ts.SourceFile, moduleSuffix: string): boolean {
  return source.statements.some((statement) => {
    return ts.isImportDeclaration(statement)
      && ts.isStringLiteral(statement.moduleSpecifier)
      && statement.moduleSpecifier.text.endsWith(moduleSuffix);
  });
}

function isRawFunctionsInvoke(expression: ts.LeftHandSideExpression): boolean {
  return ts.isPropertyAccessExpression(expression)
    && expression.name.text === 'invoke'
    && ts.isPropertyAccessExpression(expression.expression)
    && expression.expression.name.text === 'functions';
}

function isBrowserSource(relativePath: string): boolean {
  return /\.(?:ts|tsx)$/.test(relativePath)
    && !/(?:^|\/)(?:__tests__|test)(?:\/|$)/.test(relativePath)
    && !/\.(?:test|spec)\.[tj]sx?$/.test(relativePath);
}

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (entry.isFile()) {
      const relativePath = relative(repoRoot, path);
      if (isBrowserSource(relativePath)) files.push(relativePath);
    }
  }
  return files;
}

function directBrowserFunctionInvocations(): DirectFunctionInvocation[] {
  const invocations: DirectFunctionInvocation[] = [];
  for (const relativePath of sourceFiles(absolutePath('src'))) {
    if (relativePath === 'src/core/integrations/supabase/client.ts') continue;
    const { file } = parseSource(relativePath);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && isRawFunctionsInvoke(node.expression)) {
        const firstArgument = node.arguments[0];
        invocations.push({
          endpoint: firstArgument && ts.isStringLiteralLike(firstArgument) ? firstArgument.text : '<dynamic endpoint>',
          relativePath,
          line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return invocations;
}

function readGatewayManifest(): readonly string[] {
  const manifestPath = absolutePath('supabase/functions/tests/betterauth_gateway_manifest.json');
  if (!existsSync(manifestPath)) {
    return ['gallery-books', 'user-data'];
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BetterAuthGatewayManifest;
  expect(Array.isArray(manifest.gatewayFunctions), 'gateway manifest must expose a gatewayFunctions array').toBe(true);
  return manifest.gatewayFunctions;
}

function parseFunctionConfig(toml: string): ReadonlyMap<string, ReadonlyMap<string, string>> {
  const functions = new Map<string, Map<string, string>>();
  let currentFunction: Map<string, string> | undefined;

  for (const rawLine of toml.split('\n')) {
    const line = rawLine.replace(/\s+#.*$/, '').trim();
    if (!line) continue;

    const header = /^\[functions\.([A-Za-z0-9-]+)\]$/.exec(line);
    if (header) {
      currentFunction = new Map<string, string>();
      functions.set(header[1], currentFunction);
      continue;
    }

    const property = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(true|false)$/.exec(line);
    if (currentFunction && property) {
      currentFunction.set(property[1], property[2]);
    }
  }

  return functions;
}

function workflowJob(workflow: string, jobName: string): string | undefined {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line === '  ' + jobName + ':');
  if (start === -1) return undefined;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function deploysWithoutSupabaseJwt(job: string, functionName: string): boolean {
  const deployCommand = new RegExp(
    '^\\s*supabase\\s+functions\\s+deploy\\s+' + escapeRegExp(functionName)
      + '\\b(?=[^\\n]*\\s--no-verify-jwt(?:\\s|$))[^\\n]*$',
    'm',
  );
  return deployCommand.test(job);
}

function edgeSource(functionName: string): ParsedSource | undefined {
  const relativePath = 'supabase/functions/' + functionName + '/index.ts';
  return existsSync(absolutePath(relativePath)) ? parseSource(relativePath) : undefined;
}

function callsVerifyAuthWithRequest(source: ts.SourceFile): boolean {
  let verified = false;

  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'verifyAuth'
      && ts.isIdentifier(node.arguments[0])
      && node.arguments[0].text === 'req'
    ) {
      verified = true;
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return verified;
}

function callsSupabaseAuthGetUser(source: ts.SourceFile): boolean {
  let found = false;

  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node)
      && ts.isPropertyAccessExpression(node.expression)
      && node.expression.name.text === 'getUser'
      && ts.isPropertyAccessExpression(node.expression.expression)
      && node.expression.expression.name.text === 'auth'
    ) {
      found = true;
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return found;
}

const configToml = readFileSync(absolutePath('supabase/config.toml'), 'utf8');
const functionConfig = parseFunctionConfig(configToml);
const deploymentWorkflow = readFileSync(absolutePath('.github/workflows/deploy-supabase.yml'), 'utf8');
const betterAuthGatewayFunctions = readGatewayManifest();

describe('BetterAuth browser boundary contract', () => {
  it('discovers every browser Edge invocation and permits raw transport only inside the central authenticated helper', () => {
    expect(directBrowserFunctionInvocations()).toEqual([]);
  });

  it.each([
    ['checkout', 'src/app/pages/Checkout.tsx', 'create-checkout'],
    ['portal', 'src/modules/user/components/Profile.tsx', 'stripe-portal'],
    ['credits', 'src/modules/credits/hooks/useCredits.ts', 'credits'],
    ['legacy auth adapter', 'src/core/integrations/supabase/auth.ts', 'credits'],
    ['TikTok share', 'src/modules/story/utils/tiktokShare.ts', 'tiktok-auth'],
    ['TestCredits', 'src/app/pages/TestCredits.tsx', 'credits'],
    ['Gallery', 'src/app/pages/Gallery.tsx', 'gallery-books'],
    ['EbookGenerator', 'src/modules/ebook/components/EbookGenerator.tsx', 'gallery-books'],
  ] as const)('%s has no direct browser call to %s', (_label, relativePath, endpoint) => {
    expect(
      directBrowserFunctionInvocations().filter((invocation) => (
        invocation.relativePath === relativePath && invocation.endpoint === endpoint
      )),
    ).toEqual([]);
  });

  it.each([
    'src/app/pages/Gallery.tsx',
    'src/modules/ebook/components/EbookGenerator.tsx',
    'src/core/integrations/better-auth/AuthProvider.tsx',
  ])('does not retain a browser profile/library wrapper in %s', (relativePath) => {
    const source = parseSource(relativePath).file;
    expect(
      hasImportFrom(source, '/userData'),
      relativePath + ' must use a purpose-built authenticated function boundary instead of userData',
    ).toBe(false);
  });

  it('requires gallery-books and user-data in the test-owned gateway manifest', () => {
    expect(betterAuthGatewayFunctions).toContain('gallery-books');
    expect(betterAuthGatewayFunctions).toContain('user-data');
  });
});

describe('BetterAuth Edge Function deployment contract', () => {
  it.each(betterAuthGatewayFunctions)(
    '%s disables the Supabase JWT gateway in config.toml',
    (functionName) => {
      const block = functionConfig.get(functionName);
      expect(block, functionName + ' must have an explicit config block').toBeDefined();
      expect(block?.get('verify_jwt')).toBe('false');
    },
  );

  it('deploys only to the configured production environment', () => {
    expect(workflowJob(deploymentWorkflow, 'deploy-production')).toBeDefined();
    expect(workflowJob(deploymentWorkflow, 'deploy-staging')).toBeUndefined();
    expect(deploymentWorkflow).toContain('branches: [main]');
  });

  it.each(betterAuthGatewayFunctions)(
    '%s is deployed without the Supabase JWT gateway to production',
    (functionName) => {
      const job = workflowJob(deploymentWorkflow, 'deploy-production');
      expect(job, 'deploy-production is required').toBeDefined();
      expect(
        deploysWithoutSupabaseJwt(job ?? '', functionName),
        'deploy-production must deploy ' + functionName + ' with --no-verify-jwt',
      ).toBe(true);
    },
  );

  it.each(betterAuthGatewayFunctions)(
    '%s verifies the opaque BetterAuth session in handler code',
    (functionName) => {
      const source = edgeSource(functionName);
      expect(source, functionName + ' must have an Edge Function handler').toBeDefined();
      expect(
        callsVerifyAuthWithRequest(source?.file ?? ts.createSourceFile('', '', ts.ScriptTarget.Latest)),
      ).toBe(true);
    },
  );

  it('does not route BetterAuth Stripe portal sessions through supabase.auth.getUser', () => {
    const source = edgeSource('stripe-portal');
    expect(source, 'stripe-portal must have an Edge Function handler').toBeDefined();
    expect(
      callsSupabaseAuthGetUser(source?.file ?? ts.createSourceFile('', '', ts.ScriptTarget.Latest)),
    ).toBe(false);
  });
});

import { toNodeHandler } from 'better-auth/node';

import { auth } from '../../src/lib/auth-server.js';

export default toNodeHandler(auth);

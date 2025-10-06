/**
 * Story Prompts Data
 * Extracted from FlipMyEra Visual Prompts and Storyline Suggestions Collection
 */

import { EraType } from '../types/eras';

export interface StoryPrompt {
  id: string;
  eraType: EraType;
  title: string;
  description: string;
  vibeCheck: string;
  genZHook: string;
  swiftieSignal: string;
  imageUrl: string; // Will be populated from Runway generation
}

// SHOWGIRL ERA PROMPTS
export const SHOWGIRL_PROMPTS: StoryPrompt[] = [
  {
    id: 'showgirl-1',
    eraType: 'showgirl',
    title: 'The Bathtub Confession',
    description: 'After your biggest performance yet, you\'re alone in your dressing room bathtub, mascara running, when you realize the person who saved you from drowning in fame is texting to check if you\'re okay. Write what happens next.',
    vibeCheck: 'Portofino orange glitter, crystal tears, vulnerability behind the glamour',
    genZHook: 'That feeling when your public win hides your private breakdown',
    swiftieSignal: 'Behind every curtain\'s a version of you they\'ll never see',
    imageUrl: ''
  },
  {
    id: 'showgirl-2',
    eraType: 'showgirl',
    title: 'Ophelia Gets a Rewrite',
    description: 'You\'re cast as Ophelia in your school\'s Hamlet, but your director wants you to drown on stage the same week you got out of the hospital. Time to give this tragic heroine a better ending—and yourself one too.',
    vibeCheck: 'Shakespeare meets showbiz, life imitating art, choosing to swim',
    genZHook: 'When art triggers your trauma so you rewrite the whole damn play',
    swiftieSignal: 'What if Ophelia had someone to pull her from the stream?',
    imageUrl: ''
  },
  {
    id: 'showgirl-3',
    eraType: 'showgirl',
    title: 'False Lashes & Real Feelings',
    description: 'Your industry mentor just said \'you\'re only as hot as your last hit\' and you realize they\'ve been using you like they use false lashes—wearing you until you\'re ripped off and discarded. But your rival performer just offered you a genuine alliance.',
    vibeCheck: 'Industry betrayal, sisterhood over competition, orange doors opening',
    genZHook: 'That mentor who gave you \'father figure\' energy turns out to be toxic af',
    swiftieSignal: 'Trading Cartier for someone I can actually trust',
    imageUrl: ''
  },
  {
    id: 'showgirl-4',
    eraType: 'showgirl',
    title: 'The Show Must Go On (But Make It Your Show)',
    description: 'It\'s opening night, your makeup is perfect, your costume sparkles, and you\'ve never felt more fake. In 30 minutes you go on stage. Write about the moment you decide to perform as yourself instead of the version they created.',
    vibeCheck: 'Art Deco mirrors, mint green calm before the storm, authentic sparkle',
    genZHook: 'That moment when you stop performing for them and start living for you',
    swiftieSignal: 'The spotlight\'s waiting and this time you\'re in control',
    imageUrl: ''
  },
  {
    id: 'showgirl-5',
    eraType: 'showgirl',
    title: 'Portofino Orange Dreams',
    description: 'You\'re scrolling through your grandmother\'s old showgirl photos from the 1960s and find love letters that reveal she chose fame over true love. Now you\'re facing the same choice, but you have her mistakes as a roadmap.',
    vibeCheck: 'Vintage glamour meets modern love, generational healing, choosing differently',
    genZHook: 'Your grandma\'s vintage fits are fire but her relationship advice? Trauma',
    swiftieSignal: 'What if we rewrote the ending to an old Hollywood story?',
    imageUrl: ''
  }
];

// FOLKLORE/EVERMORE ERA PROMPTS
export const FOLKLORE_PROMPTS: StoryPrompt[] = [
  {
    id: 'folklore-1',
    eraType: 'folklore-evermore',
    title: 'The Cardigan & The Creek',
    description: 'You find a vintage cardigan at the thrift store with a love letter in the pocket, dated 1952. The letter leads you to a forgotten community garden where your great-grandmother planted secrets that are now blooming into your story.',
    vibeCheck: 'Muted earth tones, misty mornings, handwritten history',
    genZHook: 'That thrift store find that comes with a whole mystery',
    swiftieSignal: 'When you put on someone else\'s cardigan, you inherit their story',
    imageUrl: ''
  },
  {
    id: 'folklore-2',
    eraType: 'folklore-evermore',
    title: 'The Last Great American Dynasty (Yours)',
    description: 'Everyone in your small town has an opinion about your family\'s \'reputation,\' but you just inherited your eccentric aunt\'s cottage and her journals reveal she wasn\'t the villain they claimed—she was just free.',
    vibeCheck: 'Rebellious ancestors, small-town secrets, reclaiming narratives',
    genZHook: 'Finding out your \'crazy\' aunt was actually just living her truth',
    swiftieSignal: 'What if the mad woman was just magnificently herself?',
    imageUrl: ''
  },
  {
    id: 'folklore-3',
    eraType: 'folklore-evermore',
    title: 'Invisible String Theory',
    description: 'During a town-wide power outage, you meet someone at the creek by candlelight. As you share stories, you realize your grandparents were best friends 60 years ago in this exact spot. Turns out some connections are written in the stars—and the water.',
    vibeCheck: 'Golden hour magic, serendipity, intergenerational echoes',
    genZHook: 'When the universe is literally pushing you toward someone',
    swiftieSignal: 'One single thread of gold tied me to you',
    imageUrl: ''
  },
  {
    id: 'folklore-4',
    eraType: 'folklore-evermore',
    title: 'The Manuscript (Found)',
    description: 'You discover your mom\'s teenage journal from when she lived in this same small town 20 years ago. Her story mirrors yours so perfectly it\'s creepy—same creek, same feelings, same questions about belonging. Time to break the cycle.',
    vibeCheck: 'Autumn leaves, repeated patterns, choosing different paths',
    genZHook: 'Reading your mom\'s teen angst and realizing generational trauma is REAL',
    swiftieSignal: 'Now I know I\'m never gonna love again, the way I loved you (but healthier)',
    imageUrl: ''
  },
  {
    id: 'folklore-5',
    eraType: 'folklore-evermore',
    title: 'Champagne Problems, Herbal Tea Solutions',
    description: 'After a panic attack at a fancy college party, you escape to your grandmother\'s cottage where she teaches you that healing happens slowly, like bread rising, like gardens growing, like trust rebuilding.',
    vibeCheck: 'Cozy cabins, gentle wisdom, nature as therapist',
    genZHook: 'When your mental health glow-up involves sourdough and not social media',
    swiftieSignal: 'Sometimes the quiet is the loudest thing you\'ll ever hear',
    imageUrl: ''
  }
];

// 1989 ERA PROMPTS
export const ERA_1989_PROMPTS: StoryPrompt[] = [
  {
    id: '1989-1',
    eraType: '1989',
    title: 'Welcome to New York (But Make It Yours)',
    description: 'You just moved to the city with $500 and a dream. Your small-town ex said you\'d be back in a month. It\'s been 29 days and you\'re one viral video away from proving them wrong—or one mistake away from proving them right.',
    vibeCheck: 'Neon lights, rooftop ambitions, city skyline courage',
    genZHook: 'Main character energy in a city of 8 million other main characters',
    swiftieSignal: 'The players gonna play but I\'m just gonna shake shake shake',
    imageUrl: ''
  },
  {
    id: '1989-2',
    eraType: '1989',
    title: 'Style (But Make It Sustainable)',
    description: 'You started a vintage thrift flipping business that just went viral on TikTok. Now everyone wants your aesthetic, but your childhood best friend (who you low-key still love) thinks you\'ve sold out your small-town values for city clout.',
    vibeCheck: 'Polaroid aesthetics, entrepreneurial hustle, authentic style',
    genZHook: 'When your sustainable side hustle accidentally becomes your main gig',
    swiftieSignal: 'You got that James Dean daydream look in your eye (and a business plan)',
    imageUrl: ''
  },
  {
    id: '1989-3',
    eraType: '1989',
    title: 'Blank Space (Fresh Start Edition)',
    description: 'After a very public breakup went viral (thanks, TikTok), you\'re rewriting your narrative with a new friend group who don\'t know your past. But your ex just transferred to your school and they\'re telling a very different version of your story.',
    vibeCheck: 'Reinvention energy, squad goals, reputation reclamation',
    genZHook: 'When you\'re trying to rebrand yourself but your past has receipts',
    swiftieSignal: 'Got a blank space baby, and I\'ll write my own story',
    imageUrl: ''
  },
  {
    id: '1989-4',
    eraType: '1989',
    title: 'Out of the Woods (And Into the City)',
    description: 'You escaped your suffocating small town for art school in the city, but now your hometown best friend needs you to come back and save the community center from demolition. Choose between your new life and your roots.',
    vibeCheck: 'City lights vs. forest fires, loyalty vs. growth, impossible choices',
    genZHook: 'That friend who texts \'come home we need you\' right when you\'re finally thriving',
    swiftieSignal: 'The rest of the world was in black and white, but we were in screaming color',
    imageUrl: ''
  },
  {
    id: '1989-5',
    eraType: '1989',
    title: 'Clean (Social Media Detox)',
    description: 'You delete all your social media for 30 days to see who you are without the performance. On day 29, you meet someone who has no idea who you used to be online—and they like the real you better.',
    vibeCheck: 'Digital cleanse, authentic connections, rediscovery',
    genZHook: 'Finding out your IRL personality is actually more interesting than your feed',
    swiftieSignal: 'Ten months clean, I forgot what I looked like when no one was watching',
    imageUrl: ''
  }
];

// RED ERA PROMPTS
export const RED_PROMPTS: StoryPrompt[] = [
  {
    id: 'red-1',
    eraType: 'red',
    title: 'All Too Well (The Podcast Episode)',
    description: 'You start a podcast about surviving your first heartbreak. It goes viral. Your ex listens to every episode and starts subtweeting. Your healing becomes public spectacle, but somehow that makes it more real.',
    vibeCheck: 'Autumn heartache, creative catharsis, public vulnerability',
    genZHook: 'When your healing era becomes content and your ex becomes a cautionary tale',
    swiftieSignal: 'Time won\'t fly, it\'s like I\'m paralyzed by it (so I\'m podcasting through it)',
    imageUrl: ''
  },
  {
    id: 'red-2',
    eraType: 'red',
    title: 'I Knew You Were Trouble (But I Stayed Anyway)',
    description: 'You ignored every single red flag because they made you feel alive. Now you\'re picking up the pieces while your friends say \'we told you so.\' Write about the moment you realize the lesson wasn\'t about them—it was about why you stayed.',
    vibeCheck: 'Intense emotions, beautiful mistakes, hard-won wisdom',
    genZHook: 'That toxic situationship everyone warned you about but you had to learn yourself',
    swiftieSignal: 'Loving him was like driving a new Maserati down a dead-end street',
    imageUrl: ''
  },
  {
    id: 'red-3',
    eraType: 'red',
    title: 'The Lucky One (Imposter Syndrome Edition)',
    description: 'You got into your dream program/school/opportunity but you\'re convinced it\'s a mistake. Your best friend is dealing with actual crisis (parent\'s divorce, depression, financial stress) and you feel guilty for struggling when you \'should\' be happy.',
    vibeCheck: 'Complicated feelings, survivor\'s guilt, supporting each other',
    genZHook: 'When you\'re \'living the dream\' but drowning in imposter syndrome',
    swiftieSignal: 'Now I\'ll go sit on the floor wearing your clothes (and figure out what happiness means)',
    imageUrl: ''
  },
  {
    id: 'red-4',
    eraType: 'red',
    title: 'Begin Again (After Betrayal)',
    description: 'Your best friend/partner betrayed you in the worst way. Six months later, someone new is interested but you\'re scared of colors because you\'re so used to gray. Write about the terrifying moment you decide to feel again.',
    vibeCheck: 'Tentative hope, autumn healing, scared but trying',
    genZHook: 'When your trust issues have trust issues but you\'re tired of being numb',
    swiftieSignal: 'You throw your head back laughing and I think I\'m ready to feel again',
    imageUrl: ''
  },
  {
    id: 'red-5',
    eraType: 'red',
    title: 'The Moment I Knew (Everything Changed)',
    description: 'It\'s your birthday/graduation/big moment and the one person you needed to be there isn\'t. Write about the moment you realize you deserve people who show up, and what happens when you finally ask for what you need.',
    vibeCheck: 'Disappointment alchemy, emotional wisdom, choosing better',
    genZHook: 'That moment when you stop accepting the bare minimum from people',
    swiftieSignal: 'What do you do when the one who means the most to you is the one who didn\'t show?',
    imageUrl: ''
  }
];

// REPUTATION ERA PROMPTS
export const REPUTATION_PROMPTS: StoryPrompt[] = [
  {
    id: 'reputation-1',
    eraType: 'reputation',
    title: '...Ready For It? (Revenge Era Activated)',
    description: 'Someone leaked your private messages and now the whole school has the wrong idea about who you are. Instead of defending yourself, you\'re creating an underground zine that exposes the truth about everyone who wronged you. Welcome to your villain era.',
    vibeCheck: 'Dark lipstick, strategic planning, righteous anger',
    genZHook: 'When they try to cancel you so you cancel the whole system',
    swiftieSignal: 'I see how this is gonna go: touch me and you\'ll never be alone',
    imageUrl: ''
  },
  {
    id: 'reputation-2',
    eraType: 'reputation',
    title: 'Don\'t Blame Me (For Fighting Back)',
    description: 'The school administration covered up something serious to protect the \'star student.\' You and three other victims are planning to go public at graduation. But one of you is getting cold feet because they\'re being threatened.',
    vibeCheck: 'Justice seeking, solidarity, calculated revelation',
    genZHook: 'When being the \'difficult\' one means being the brave one',
    swiftieSignal: 'For you, I would cross the line (and burn down the whole system)',
    imageUrl: ''
  },
  {
    id: 'reputation-3',
    eraType: 'reputation',
    title: 'Look What You Made Me Do (Reclamation)',
    description: 'Your ex/former friend is telling everyone you\'re \'crazy\' for setting boundaries. Write about the moment you stop trying to be likable and start being free.',
    vibeCheck: 'Phoenix rising, reputation reclamation, zero f*cks',
    genZHook: 'That moment when you realize \'difficult\' just means you stopped letting them use you',
    swiftieSignal: 'I\'m sorry, the old me can\'t come to the phone right now. Why? She\'s dead.',
    imageUrl: ''
  },
  {
    id: 'reputation-4',
    eraType: 'reputation',
    title: 'Call It What You Want (Despite What They Say)',
    description: 'Everyone has opinions about your relationship/friendship/choice but you\'ve never been happier. Write about loving something publicly that everyone privately judges.',
    vibeCheck: 'Defiant joy, protective love, middle fingers up',
    genZHook: 'When they\'re all talking but you\'re too busy being happy',
    swiftieSignal: 'My castle crumbled overnight but I\'m building it back with somebody better',
    imageUrl: ''
  },
  {
    id: 'reputation-5',
    eraType: 'reputation',
    title: 'Getaway Car (But Make It Activism)',
    description: 'You and your friends expose corruption in your school/community. The backlash is immediate and brutal. Now you\'re planning how to stay safe while staying loud.',
    vibeCheck: 'Strategic resistance, adrenaline ethics, chosen family',
    genZHook: 'When doing the right thing means being the target',
    swiftieSignal: 'We were jet set, Bonnie and Clyde (but make it social justice)',
    imageUrl: ''
  }
];

// LOVER ERA PROMPTS
export const LOVER_PROMPTS: StoryPrompt[] = [
  {
    id: 'lover-1',
    eraType: 'lover',
    title: 'You Need to Calm Down (Pride Edition)',
    description: 'You\'re organizing your school\'s first-ever Pride celebration and facing unexpected resistance from administration. Your straight best friend just went full ally mode and is ready to fight harder than anyone.',
    vibeCheck: 'Rainbow everything, fierce allyship, joyful rebellion',
    genZHook: 'When your ally shows up harder than some people in the community',
    swiftieSignal: 'Why are you mad when you could be GLAAD?',
    imageUrl: ''
  },
  {
    id: 'lover-2',
    eraType: 'lover',
    title: 'Lover (In All Its Forms)',
    description: 'Write about the moment you realize love isn\'t just romantic—it\'s your chosen family, your found community, the people who celebrate your wins and hold you through losses.',
    vibeCheck: 'Pastel joy, inclusive celebration, multiple love languages',
    genZHook: 'That friend group that\'s basically a polycule of platonic soulmates',
    swiftieSignal: 'Can I go where you go? Can we always be this close?',
    imageUrl: ''
  },
  {
    id: 'lover-3',
    eraType: 'lover',
    title: 'The Man (But You\'re Not Waiting)',
    description: 'You\'re tired of being told you\'re \'too much\' (too loud, too ambitious, too everything). Write about the moment you realize the problem isn\'t you—it\'s everyone trying to make you smaller.',
    vibeCheck: 'Confident power, gender role rebellion, unapologetic ambition',
    genZHook: 'When you realize \'intimidating\' is a compliment not an insult',
    swiftieSignal: 'If I was a man, I\'d be the man (but I\'m already the man as I am)',
    imageUrl: ''
  },
  {
    id: 'lover-4',
    eraType: 'lover',
    title: 'Daylight (After Depression)',
    description: 'You\'ve been in therapy for six months and for the first time you can imagine a future that doesn\'t hurt. Write about the small joys that signal you\'re healing.',
    vibeCheck: 'Golden hour hope, gentle healing, sustainable happiness',
    genZHook: 'When your mental health glow-up is quiet but revolutionary',
    swiftieSignal: 'I once believed love would be burning red, but it\'s golden',
    imageUrl: ''
  },
  {
    id: 'lover-5',
    eraType: 'lover',
    title: 'Paper Rings (Choosing Authentic Joy)',
    description: 'Everyone expects you to want the perfect influencer life, but you realize you\'d rather have messy genuine moments with real friends than aesthetic perfection with fake ones.',
    vibeCheck: 'Authentic over aesthetic, real love wins, choosing substance',
    genZHook: 'When you unfollow the highlight reel and follow your heart',
    swiftieSignal: 'I like shiny things but I\'d marry you with paper rings',
    imageUrl: ''
  }
];

// MIDNIGHTS ERA PROMPTS
export const MIDNIGHTS_PROMPTS: StoryPrompt[] = [
  {
    id: 'midnights-1',
    eraType: 'midnights',
    title: 'Anti-Hero (3AM Thoughts)',
    description: 'It\'s 3 AM and you\'re spiraling about everything you\'ve ever done wrong. Write the texts you almost send, the apologies you almost make, and what happens when your phone dies and forces you to just... sit with yourself.',
    vibeCheck: 'Late-night vulnerability, millennial anxiety, gentle self-compassion',
    genZHook: 'That 3 AM overthinking session that\'s basically unpaid therapy',
    swiftieSignal: 'It\'s me, hi, I\'m the problem, it\'s me (but also capitalism and unrealistic expectations)',
    imageUrl: ''
  },
  {
    id: 'midnights-2',
    eraType: 'midnights',
    title: 'Lavender Haze (In This Economy?)',
    description: 'Everyone\'s asking about your five-year plan but you\'re just trying to get through tomorrow. Write about finding peace in the unknown.',
    vibeCheck: 'Purple uncertainty, pressure resistance, present moment magic',
    genZHook: 'When everyone wants your 10-year plan and you\'re like \'I have soup for dinner\'',
    swiftieSignal: 'All they keep asking me is if I\'m gonna marry them, I\'m just trying to graduate first',
    imageUrl: ''
  },
  {
    id: 'midnights-3',
    eraType: 'midnights',
    title: 'Midnight Rain (Different Dreams)',
    description: 'Your childhood best friend is on track for everything you used to want together. You changed paths and they stayed the course. Neither is wrong, but the distance feels impossible.',
    vibeCheck: 'Diverging paths, bittersweet growth, honoring change',
    genZHook: 'When you and your person want different futures and nobody\'s the villain',
    swiftieSignal: 'He wanted a bride, I was making my own name',
    imageUrl: ''
  },
  {
    id: 'midnights-4',
    eraType: 'midnights',
    title: 'Question...? (The One You Can\'t Ask)',
    description: 'There\'s a question you\'re afraid to ask (about identity, about feelings, about futures) because once you ask it, everything changes. Write about the night you finally ask.',
    vibeCheck: 'Moonlit courage, transformative questions, brave vulnerability',
    genZHook: 'That question that\'s been living rent-free in your brain at 2 AM',
    swiftieSignal: 'Did you leave me hanging every single day, or was it all just in my mind?',
    imageUrl: ''
  },
  {
    id: 'midnights-5',
    eraType: 'midnights',
    title: 'Mastermind (But Make It Anxiety)',
    description: 'You\'ve been orchestrating everything perfectly—your grades, your image, your relationships. Write about the moment your perfectly controlled life falls apart and you realize chaos might be freedom.',
    vibeCheck: 'Control vs. surrender, perfectionism breakdown, liberating mess',
    genZHook: 'When your perfectly curated life implodes and it\'s weirdly... better?',
    swiftieSignal: 'What if I told you none of it was accidental?',
    imageUrl: ''
  }
];

// Aggregate all prompts
export const ALL_STORY_PROMPTS: StoryPrompt[] = [
  ...SHOWGIRL_PROMPTS,
  ...FOLKLORE_PROMPTS,
  ...ERA_1989_PROMPTS,
  ...RED_PROMPTS,
  ...REPUTATION_PROMPTS,
  ...LOVER_PROMPTS,
  ...MIDNIGHTS_PROMPTS
];

// Helper functions
export function getPromptsByEra(eraType: EraType): StoryPrompt[] {
  return ALL_STORY_PROMPTS.filter(prompt => prompt.eraType === eraType);
}

export function getPromptById(id: string): StoryPrompt | undefined {
  return ALL_STORY_PROMPTS.find(prompt => prompt.id === id);
}

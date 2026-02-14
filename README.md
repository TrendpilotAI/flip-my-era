# 🎵 FlipMyEra - AI-Powered Story Generation Platform

**Transform your stories into different eras with the magic of AI**

## 🌟 What is FlipMyEra?

FlipMyEra is an innovative AI-powered platform that transforms user-submitted stories into beautifully crafted, era-specific narratives with professional illustrations. Think of it as your personal storytelling companion that can take any story and reimagine it through the lens of different time periods, themes, and artistic styles.

### ✨ Key Features:
- **AI Story Transformation**: Convert any story into different eras and themes
- **Professional E-Book Generation**: Create full-length illustrated e-books (1,000-25,000 words)
- **Taylor Swift-Inspired Themes**: Coming-of-age, first love, heartbreak, friendship, small-town vs. big city life
- **High-Quality Illustrations**: AI-generated images using FLUX 1.1 Pro model
- **Real-Time Streaming**: Watch your story come to life with live text generation
- **Professional Formatting**: Album-inspired layouts with beautiful typography

## 🎯 Who Does FlipMyEra Appeal To?

### Primary Audience: **Teenage Taylor Swift Fans (13-19 years old)**
- **Swifties** who love storytelling and creative expression
- Young adults interested in **YA fiction** and coming-of-age narratives
- **Creative writers** looking for inspiration and new perspectives on their stories
- **Social media enthusiasts** who want shareable, aesthetic content

### Secondary Audience:
- **Parents** looking for age-appropriate creative tools for their teens
- **Educators** using storytelling for creative writing classes
- **Content creators** seeking unique, personalized stories for their platforms
- **Anyone** who loves stories and wants to see them reimagined

## 🚀 The Goal of FlipMyEra

### **Primary Mission:**
Transform storytelling from a solitary activity into an **interactive, AI-enhanced creative experience** that makes professional-quality story creation accessible to everyone.

### **Core Objectives:**

#### 1. **Democratize Creative Writing**
- Remove barriers to creating professional-looking stories
- Provide AI assistance for plot development and narrative enhancement
- Make illustration and book design accessible without technical skills

#### 2. **Inspire Young Storytellers**
- Encourage creative expression through familiar themes (Taylor Swift-inspired)
- Build confidence in writing through AI collaboration
- Create shareable content that celebrates their creativity

#### 3. **Build a Sustainable Creative Platform**
- **Simple monetization**: $2.99 per e-book generation
- **Quality over quantity**: Focus on premium, polished output
- **Community building**: Connect young writers through shared themes

#### 4. **Innovate in AI Storytelling**
- Push boundaries of **real-time story generation**
- Integrate **thematic visual generation** that matches narrative mood
- Create **seamless user experience** from idea to finished e-book

### **Long-Term Vision:**
Become the **go-to platform** for young adults to transform their stories into professional, shareable content that celebrates their creativity while providing them with tools to explore different narrative styles, themes, and artistic presentations.

## 🎨 What Makes FlipMyEra Special?

- **Era Transformation**: Not just story editing, but complete reimagining across time periods
- **Thematic Intelligence**: AI that understands emotional beats and matches visuals accordingly
- **Taylor Swift Aesthetic**: Familiar themes that resonate with Gen Z
- **Premium Quality**: Professional-grade output at an accessible price point
- **Instant Gratification**: Fast generation with beautiful streaming UI
- **Mobile-First**: Designed for the smartphone generation

---

*FlipMyEra: Where your stories meet their perfect era* ✨

## Features

- **Google Authentication**: Secure sign-in with Google OAuth
- **Story Generation**: Create stories in different eras and styles using AI
- **User Dashboard**: Manage your stories and account settings
- **Subscription Plans**: Access premium features with different subscription tiers
- **AI-Powered**: Uses Groq and OpenAI for story and image generation

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase for authentication and database
- **Deployment**: Netlify
- **AI Integration**: Groq and OpenAI for story and image generation

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account
- Google OAuth credentials

### Installation

1. Clone the repository:
```sh
git clone https://github.com/TrendpilotAI/flip-my-era.git
cd flip-my-era
```

2. Install dependencies:
```sh
npm install
```

3. Create a `.env` file with the required environment variables:
```sh
# API Keys for AI Services (managed by system administrator)
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
VITE_OPENAI_API_KEY=sk-your_openai_api_key_here

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe (Optional)
VITE_STRIPE_API_KEY=your_stripe_api_key_here
VITE_STRIPE_MERCHANT_ID=your_stripe_merchant_id_here
```

4. Start the development server:
```sh
npm run dev
```

5. Open [http://localhost:8080](http://localhost:8080) in your browser.

## Deployment

The application is configured for deployment on Netlify. The `netlify.toml` file contains the necessary configuration.

To deploy:

1. Push your changes to the main branch
2. Netlify will automatically build and deploy the application

## Environment Variables

The following environment variables are required:

### AI Services (Managed by System Administrator)
- `VITE_GROQ_API_KEY`: Groq API key for story generation
- `VITE_OPENAI_API_KEY`: OpenAI API key for image generation

### Authentication & Database
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk authentication publishable key
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### E-commerce (Optional)
- `VITE_STRIPE_API_KEY`: Stripe API key for checkout functionality
- `VITE_STRIPE_MERCHANT_ID`: Stripe merchant ID

## User Experience

Users no longer need to configure API keys or worry about tokens. All AI services are managed by the system administrator and are ready to use immediately after signing in.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

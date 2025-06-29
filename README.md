# Flip My Era

A modern web application that allows users to transform their stories across different eras and styles.

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

# SamCart (Optional)
VITE_SAMCART_API_KEY=your_samcart_api_key_here
VITE_SAMCART_MERCHANT_ID=your_samcart_merchant_id_here
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
- `VITE_SAMCART_API_KEY`: SamCart API key for checkout functionality
- `VITE_SAMCART_MERCHANT_ID`: SamCart merchant ID

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

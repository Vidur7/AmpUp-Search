import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-16">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
                Optimize Your Content with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600"> AmpUp</span>
              </h1>
              <p className="mt-3 text-xl sm:text-2xl text-gray-600">
                SEO for Large Language Models
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <a
                  href="https://chrome.google.com/webstore"
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
                >
                  Add to Chrome
                </a>
                <a
                  href="#how-it-works"
                  className="px-8 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:border-gray-400 transition-all"
                >
                  Learn More
                </a>
              </div>
              <p className="mt-6 text-center text-gray-600 text-lg">
                One click to install. Instant insight into your AI-first visibility.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-700 mb-4">
              Optimize Smarter. Grow Faster.
            </h2>
            <h2 className="text-3xl font-bold text-center mb-16">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">AmpUp</span>
              {' '}
              <span className="text-gray-700">Like a Pro.</span>
            </h2>
            <p className="text-xl font-bold text-center text-gray-800 mb-16">
              Stand out to Large Language Models in the AI-First World.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              How <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">AmpUp</span> Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-xl font-semibold">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              See <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">AmpUp</span> in Action
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Real-time Content Analysis
                </h3>
                <p className="text-gray-600">
                  Watch how AmpUp analyzes your content in real-time, providing actionable insights and recommendations for better AI optimization.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Instant Feedback</h4>
                      <p className="text-sm text-gray-600">Get immediate insights about your content&apos;s AI readability</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Smart Suggestions</h4>
                      <p className="text-sm text-gray-600">Receive AI-powered recommendations for improvement</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Easy Integration</h4>
                      <p className="text-sm text-gray-600">Works seamlessly with your existing workflow</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-500">Demo video coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-center text-gray-600 mb-16">
              Start optimizing your content for free. Upgrade when you're ready.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="rounded-2xl border-2 border-gray-200 p-8 hover:border-indigo-500 transition-all">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Plan</h3>
                <p className="text-gray-600 mb-6">Perfect for getting started with AI optimization</p>
                <div className="text-4xl font-bold text-gray-900 mb-6">
                  $0 <span className="text-base font-normal text-gray-600">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    5 detailed content analyses per month
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Basic optimization recommendations
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Chrome extension access
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full py-3 px-4 rounded-full text-center bg-white border-2 border-indigo-500 text-indigo-600 font-medium hover:bg-indigo-50 transition-all"
                >
                  Get Started
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="rounded-2xl border-2 border-indigo-500 p-8 bg-gradient-to-b from-white to-indigo-50 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Popular
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro Plan</h3>
                <p className="text-gray-600 mb-6">For professionals and growing businesses</p>
                <div className="text-4xl font-bold text-gray-900 mb-6">
                  $20 <span className="text-base font-normal text-gray-600">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Unlimited detailed content analyses
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Advanced AI optimization insights
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Priority support
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Export detailed reports
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    API access
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full py-3 px-4 rounded-full text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600">
                All plans include our Chrome extension and basic content analysis features.
                <br />
                Need a custom plan for your enterprise?{' '}
                <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const features = [
  {
    icon: '🎯',
    title: 'Content Analysis',
    description: 'Get detailed insights on how AmpUp perceives and processes your content.',
  },
  {
    icon: '📊',
    title: 'SEO for Large Language Models',
    description: 'Optimize your content specifically for better AI understanding and indexing.',
  },
  {
    icon: '🔄',
    title: 'Real-time Feedback',
    description: 'Receive instant suggestions and improvements as you create content.',
  },
];

const steps = [
  {
    title: 'Install Extension',
    description: 'Add AmpUp to Chrome with a single click.',
  },
  {
    title: 'Analyze Content',
    description: 'Click the extension on any webpage to start analysis.',
  },
  {
    title: 'Get Insights',
    description: 'Review detailed optimization recommendations.',
  },
  {
    title: 'Improve Content',
    description: 'Apply suggestions to enhance AI readability.',
  },
];

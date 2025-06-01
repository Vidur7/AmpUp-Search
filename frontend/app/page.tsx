import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

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
                Optimize Your Content for
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600"> LLMs</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600">
                Analyze and enhance your content for better AI understanding. Get actionable insights and improve your content&apos;s visibility to Large Language Models.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <a
                  href="https://chrome.google.com/webstore"
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
                >
                  Add to Chrome
                </a>
                <a
                  href="#features"
                  className="px-8 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:border-gray-400 transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              Everything you need for LLM optimization
            </h2>
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
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              How LLMO Works
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
              See LLMO in Action
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Real-time Content Analysis
                </h3>
                <p className="text-gray-600">
                  Watch how LLMO analyzes your content in real-time, providing actionable insights and recommendations for better AI optimization.
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
      </main>
      <Footer />
    </>
  );
}

const features = [
  {
    icon: '🎯',
    title: 'Content Analysis',
    description: 'Get detailed insights on how LLMs perceive and process your content.',
  },
  {
    icon: '📊',
    title: 'SEO for LLMs',
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
    description: 'Add LLMO to Chrome with a single click.',
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

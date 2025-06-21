export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
            AmpUp
          </span>
          <p className="mt-4 text-gray-600 max-w-md mx-auto">
            Optimize your content for better AI understanding and visibility with AmpUp&apos;s powerful analysis tools.
          </p>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500">
            © {new Date().getFullYear()} AmpUp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 
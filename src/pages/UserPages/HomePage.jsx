import { useNavigate } from "react-router-dom";

export default function HomePage() {

  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Revolutionize Communication with
            <span className="text-blue-600 block mt-3">Smart Notice AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Automated, intelligent notice generation and distribution powered by AI. Save time, reduce errors, and enhance engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={()=> navigate('/notices')} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition duration-300">
              Get Started
            </button>
            <button className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg shadow-md transition duration-300">
              See Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Powerful Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Automated Notice Generation</h3>
              <p className="text-gray-600">
                Create professional notices in seconds with AI-powered templates and content suggestions.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Distribution</h3>
              <p className="text-gray-600">
                Automatically send notices via email, SMS, or app notifications based on recipient preferences.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Optimization</h3>
              <p className="text-gray-600">
                Our AI analyzes engagement data to optimize future notices for better response rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <div className="md:w-1/3 flex justify-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">1</div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-xl font-semibold mb-3">Configure Your Settings</h3>
                <p className="text-gray-600">
                  Set up your organization profile, notice templates, and distribution preferences in our intuitive dashboard.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <div className="md:w-1/3 flex justify-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">2</div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-xl font-semibold mb-3">Create Your Notice</h3>
                <p className="text-gray-600">
                  Use our AI-powered editor to craft your notice. The system will suggest improvements and flag potential issues.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 flex justify-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">3</div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-xl font-semibold mb-3">Review & Send</h3>
                <p className="text-gray-600">
                  Preview your notice, make any final adjustments, and let our system handle distribution and tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Notices?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join hundreds of organizations using Smart Notice AI to save time and improve communication.
          </p>
          <button className="px-8 py-3 bg-white hover:bg-gray-100 text-blue-600 font-medium rounded-lg shadow-lg transition duration-300">
            Start Your Free Trial
          </button>
        </div>
      </section>
    </main>
  );
}
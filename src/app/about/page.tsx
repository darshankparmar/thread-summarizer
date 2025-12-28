export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            About ThreadWise
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            AI-powered insights for forum discussions
          </p>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 p-8 backdrop-blur-sm">
          <div className="prose prose-lg max-w-none">
            <div className="text-text-primary space-y-6">
              <p className="text-lg leading-relaxed">
                ThreadWise is an intelligent analysis tool that helps you understand forum discussions at a glance. 
                Using advanced AI technology, we extract key insights, summarize lengthy conversations, and provide 
                sentiment analysis to help you quickly grasp the essence of any thread.
              </p>

              <h2 className="text-2xl font-semibold text-text-primary mt-8 mb-4">Features</h2>
              <ul className="space-y-3 text-text-secondary">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>AI-powered thread summarization</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Key discussion points extraction</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Contributor insights and analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Sentiment analysis and health scoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>Clean, responsive interface with dark/light themes</span>
                </li>
              </ul>

              <h2 className="text-2xl font-semibold text-text-primary mt-8 mb-4">How It Works</h2>
              <p className="text-text-secondary leading-relaxed">
                Simply browse available threads or enter a specific thread ID to get started. Our AI analyzes 
                the conversation, identifies key contributors, extracts main discussion points, and provides 
                an overall sentiment assessment. Perfect for moderators, researchers, or anyone who wants to 
                quickly understand complex forum discussions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
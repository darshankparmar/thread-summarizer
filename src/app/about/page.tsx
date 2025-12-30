export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            About ThreadWise
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            AI-powered insights for forum discussions with intelligent analysis and summarization
          </p>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-secondary/20 p-8 backdrop-blur-sm">
          <div className="prose prose-lg max-w-none">
            <div className="text-text-primary space-y-6">
              <p className="text-lg leading-relaxed">
                ThreadWise is an intelligent analysis tool that helps you understand forum discussions at a glance. 
                Using advanced AI technology, we extract key insights, summarize lengthy conversations, and provide 
                sentiment analysis to help you quickly grasp the essence of any thread from Foru.ms.
              </p>

              <h2 className="text-2xl font-semibold text-text-primary mt-8 mb-4">✨ Features</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <h3 className="font-medium text-text-primary">AI-Powered Summarization</h3>
                    <p className="text-sm text-text-secondary">Get concise summaries of lengthy discussions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <h3 className="font-medium text-text-primary">Key Points Extraction</h3>
                    <p className="text-sm text-text-secondary">Identify main discussion points and arguments</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <h3 className="font-medium text-text-primary">Contributor Analysis</h3>
                    <p className="text-sm text-text-secondary">See who contributed most valuable insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <h3 className="font-medium text-text-primary">Sentiment & Health Scoring</h3>
                    <p className="text-sm text-text-secondary">Understand the tone and constructiveness</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <h3 className="font-medium text-text-primary">Dark/Light Themes</h3>
                    <p className="text-sm text-text-secondary">Clean, responsive interface with theme support</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <h3 className="font-medium text-text-primary">Thread Creation</h3>
                    <p className="text-sm text-text-secondary">Create and manage forum discussions</p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-text-primary mt-8 mb-4">🚀 How It Works</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h3 className="font-medium text-text-primary">Browse or Search</h3>
                    <p className="text-text-secondary">Browse available threads or enter a specific thread ID to analyze</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h3 className="font-medium text-text-primary">AI Analysis</h3>
                    <p className="text-text-secondary">Our AI analyzes the conversation, identifies key contributors, and extracts main points</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h3 className="font-medium text-text-primary">Get Insights</h3>
                    <p className="text-text-secondary">Receive comprehensive summaries with sentiment analysis and health scoring</p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-text-primary mt-8 mb-4">🎯 Perfect For</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl mb-2">👥</div>
                  <h3 className="font-medium text-text-primary">Moderators</h3>
                  <p className="text-sm text-text-secondary">Quickly assess discussion health</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl mb-2">🔬</div>
                  <h3 className="font-medium text-text-primary">Researchers</h3>
                  <p className="text-sm text-text-secondary">Analyze community discussions</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl mb-2">📚</div>
                  <h3 className="font-medium text-text-primary">Anyone</h3>
                  <p className="text-sm text-text-secondary">Understand complex discussions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
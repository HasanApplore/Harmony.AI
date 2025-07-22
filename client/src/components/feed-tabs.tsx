interface FeedTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRecentPostsClick?: () => void;
}

export default function FeedTabs({ activeTab, onTabChange, onRecentPostsClick }: FeedTabsProps) {
  const tabs = [
    { id: "for-you", name: "For You" },
    { id: "trending", name: "Trending" },
    { id: "jobs", name: "Recommended Jobs" },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="feed-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`feed-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="hidden md:flex">
          <button 
            onClick={onRecentPostsClick}
            className="text-purple-600 text-sm font-medium hover:underline"
          >
            Most Recent Posts
          </button>
        </div>
      </div>
    </div>
  );
}

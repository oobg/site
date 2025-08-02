interface Tool {
  name: string;
  description: string;
  icon: string;
  features: string[];
  status: string;
}

const tools: Tool[] = [
  {
    name: "Raven Formatter",
    description: "까마귀의 정밀함으로 코드를 자동 포맷팅합니다. 다양한 언어와 커스텀 규칙을 지원합니다.",
    icon: "✨",
    features: ["다중 언어", "커스텀 규칙", "Git 통합"],
    status: "Ready"
  },
  {
    name: "Raven Generator",
    description: "까마귀의 지능으로 안전한 비밀번호를 생성합니다. 복잡하면서도 기억하기 쉬운 비밀번호를 만듭니다.",
    icon: "🔐",
    features: ["안전함", "기억하기 쉬움", "커스터마이징"],
    status: "Ready"
  },
  {
    name: "Raven Palette",
    description: "프로젝트를 위한 아름다운 색상 조합을 만듭니다. AI 기반 색상 조화.",
    icon: "🎨",
    features: ["AI 기반", "내보내기", "미리보기"],
    status: "Beta"
  }
];

export function Tools() {
  return (
    <section id="tools" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="mb-6">
          <span className="text-6xl raven-icon-bg">🦅</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gradient">
          Raven 도구들
        </h2>
        <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
          개발 워크플로우를 간소화하고 생산성을 향상시키기 위해 
          까마귀의 지혜로 만든 도구들입니다.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {tools.map((tool, index) => (
          <div 
            key={index} 
            className="group relative mystical-card rounded-2xl p-8 text-center hover:-translate-y-2 hover:shadow-lg transition-all duration-300 raven-shadow overflow-hidden"
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                tool.status === 'Ready' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white'
              }`}>
                {tool.status === 'Ready' ? '준비됨' : '베타'}
              </span>
            </div>
            
            {/* Tool Icon */}
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
              {tool.icon}
            </div>
            
            {/* Tool Title */}
            <h3 className="text-xl font-bold mb-4 text-text-primary group-hover:text-accent transition-all duration-300">
              {tool.name}
            </h3>
            
            {/* Tool Description */}
            <p className="text-text-secondary mb-6 leading-relaxed text-sm">
              {tool.description}
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {tool.features.map((feature, featureIndex) => (
                <span 
                  key={featureIndex} 
                  className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20 transition-all duration-300"
                >
                  {feature}
                </span>
              ))}
            </div>
            
            {/* Try Button */}
            <button className="px-6 py-3 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent hover:text-white transition-all duration-300 group-hover:scale-105">
              지금 사용해보기
            </button>
            
            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </div>
        ))}
      </div>
      
      {/* Call to Action */}
      <div className="text-center mt-16">
        <p className="text-text-secondary mb-4">워크플로우에 맞는 커스텀 도구가 필요하신가요?</p>
        <button className="px-8 py-4 bg-gradient-to-r from-accent to-accent-hover text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300 raven-shadow">
          커스텀 도구 요청하기
        </button>
      </div>
    </section>
  );
}

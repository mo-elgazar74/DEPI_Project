import { Mic, FileText, GraduationCap, Lightbulb } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Mic,
      title: "شرح صوتي تفاعلي",
      description: "استمع للشرح بصوت واضح",
    },
    {
      icon: FileText,
      title: "مواد حصري للمنهج",
      description: "محتوى متوافق مع المنهج المصري",
    },
    {
      icon: GraduationCap,
      title: "للطلاب بجميع المراحل",
      description: "الابتدائية إلى الثانوية العامة",
    },
    {
      icon: Mic,
      title: "التفاعل الصوتي المباشر",
      description: "اسأل بصوتك واحصل على إجابات",
    },
    {
      icon: FileText,
      title: "ملخصات دراسية",
      description: "ملخصات شاملة لكل درس",
    },
    {
      icon: Mic,
      title: "حضور التسجيلات",
      description: "سجل وراجع الدروس في أي وقت",
    },
    {
      icon: Lightbulb,
      title: "رؤيتنا معلوماتك",
      description: "نصائح وإرشادات تعليمية",
    },
    {
      icon: Lightbulb,
      title: "تركيبة الإبداعي",
      description: "طرق مبتكرة للتعلم والفهم",
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container px-4 mx-auto">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">EduBot Egypt أعاص</h2>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow text-center space-y-3"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

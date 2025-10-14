import { Link } from "react-router-dom"
import { Button } from "@/components/edubot/ui/button"
import { BookOpen, Backpack, Calculator, Bot } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container px-4 py-12 md:py-20 mx-auto">
        <div className="grid lg:grid-cols-2 gap-0 items-stretch max-w-7xl mx-auto">
          <div className="relative">
            <div className="relative bg-gradient-to-br from-orange-200 via-orange-100 to-orange-50 rounded-3xl lg:rounded-r-none p-8 md:p-12 overflow-hidden min-h-[600px] flex flex-col justify-between">
              {/* Decorative Elements */}
              <div className="absolute top-8 left-8 text-3xl opacity-40">💡</div>

              <div className="relative z-10 space-y-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  علّم – EduBot Egypt
                  <br />
                  الشباب أعيد الحاسب
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                  الآن نظام يمكنكم أوجد معنا في مواتر
                  <br />
                  استخدام المحادثاتنا استفسارك
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-full border-2 border-foreground bg-transparent hover:bg-foreground hover:text-background font-semibold"
                  >
                    <Link to="/signin">تسجيل الدخول</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-full border-2 border-foreground bg-transparent hover:bg-foreground hover:text-background font-semibold"
                  >
                    <Link to="/signup">إنشاء حساب</Link>
                  </Button>
                </div>
              </div>

              {/* Robot Mascot */}
              <div className="relative z-10 flex justify-center items-end mt-8">
                <img
                  src="/cute-friendly-robot-mascot-with-graduation-cap-hol.jpg"
                  alt="EduBot Mascot"
                  className="w-full max-w-sm drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 rounded-3xl lg:rounded-l-none p-8 md:p-12 min-h-[600px] flex flex-col justify-between">
              {/* Text Content */}
              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  باستخدام منصة متكاملة يقدم عليها EduBot Egypt المنهاج التعليمي (الابتدائي أو الإعدادي)
                </p>

                {/* Icons */}
                <div className="flex gap-4 justify-center lg:justify-start">
                  <div className="w-14 h-14 rounded-full bg-blue-200/50 flex items-center justify-center">
                    <Calculator className="w-7 h-7 text-primary" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-blue-200/50 flex items-center justify-center">
                    <Backpack className="w-7 h-7 text-primary" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-blue-200/50 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-primary" />
                  </div>
                </div>
              </div>

              {/* Phone Mockup */}
              <div className="relative max-w-sm mx-auto lg:mx-0">
                <div className="relative bg-[#1e3a5f] rounded-[2.5rem] p-3 shadow-2xl border-8 border-[#1e3a5f]">
                  <div className="bg-white rounded-[1.75rem] overflow-hidden">
                    {/* Phone Header */}
                    <div className="bg-primary text-primary-foreground p-4 flex items-center justify-center gap-2">
                      <span className="font-semibold text-lg">EduBot Egypt</span>
                      <Bot className="w-5 h-5" />
                    </div>

                    {/* Chat Messages */}
                    <div className="p-4 space-y-3 bg-gray-50 min-h-[320px]">
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                          <p className="text-sm">اشرح لي درس الكسور</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
                          <p className="text-sm text-foreground">طبعاً هشرح لك درس الكسور بطريقة سهلة...</p>
                        </div>
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-border">
                      <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center justify-center">
                        <Button size="sm" className="rounded-full h-8 px-6 bg-primary">
                          إرسال
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Phone bottom bar */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/30 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

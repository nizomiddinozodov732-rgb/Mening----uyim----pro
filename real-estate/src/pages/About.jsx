import { Target, Users, Award, Heart } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Biz haqimizda</h1>
          <p className="text-xl text-blue-100">O'zbekistondagi ishonchli ko'chmas mulk platformasi</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Bizning vazifamiz</h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto leading-relaxed">
            "Uy-Joy Savdosi" 2020 yildan beri O'zbekistonda ko'chmas mulk bozorida faoliyat yuritib kelmoqda. 
            Bizning maqsadimiz - har bir fuqaro uchun uy-joy topish va sotish jarayonini oson va xavfsiz qilish.
            Biz mijozlarimizga eng yaxshi xizmatni ko'rsatishga va ularning ishonchini qozonishga intilamiz.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-3">Maqsadga yo'naltirilgan</h3>
            <p className="text-gray-600">Har doim mijozlarimiz maqsadlariga erishishga yordam beramiz</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-3">Jamoa ishi</h3>
            <p className="text-gray-600">Professional jamoa bilan ishlashimiz kafolat</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-3">Sifat</h3>
            <p className="text-gray-600">Eng yuqori sifatdagi xizmatni taqdim etamiz</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-3">Vijdonanlik</h3>
            <p className="text-gray-600">Halol va shaffof biznes yuritamiz</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-blue-600 rounded-xl p-12 text-white mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">4+</div>
              <div className="text-blue-100">Yillik tajriba</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">5000+</div>
              <div className="text-blue-100">Muvaffaqiyatli savdo</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10000+</div>
              <div className="text-blue-100">Mijozlar</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Professional broker</div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Bizning jamoa</h2>
          <p className="text-gray-600 text-lg">Professional va tajribali mutaxassislar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aziz Karimov</h3>
              <p className="text-blue-600 mb-3">Bosh direktor</p>
              <p className="text-gray-600 text-sm">10 yillik tajribaga ega ko'chmas mulk bo'yicha mutaxassis</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-green-400 to-green-600"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nilufar Rahimova</h3>
              <p className="text-blue-600 mb-3">Operatsion menejer</p>
              <p className="text-gray-600 text-sm">8 yillik tajriba, mijozlar bilan ishlash bo'yicha ekspert</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600"></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Bekzod Toshmatov</h3>
              <p className="text-blue-600 mb-3">Bosh broker</p>
              <p className="text-gray-600 text-sm">7 yillik tajriba, katta savdolar bo'yicha mutaxassis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

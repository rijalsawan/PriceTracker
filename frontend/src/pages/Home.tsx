import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  BellIcon, 
  ShoppingCartIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  SparklesIcon,
  ArrowTrendingDownIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  PlusIcon,
  EyeIcon,
  ChartPieIcon,
  InformationCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import SEO from '../components/SEO';

const Home: React.FC = () => {
  const features = [
    {
      icon: LinkIcon,
      title: 'Easy Product Addition',
      description: 'Simply paste any Amazon product URL and start tracking instantly. Our advanced scraper extracts all product details automatically.',
      color: 'text-blue-600'
    },
    {
      icon: ChartPieIcon,
      title: 'Real-Time Price Monitoring',
      description: 'Monitor Amazon prices 24/7 with automatic checks. See live price changes, historical data, and price trend analysis.',
      color: 'text-green-600'
    },
    {
      icon: BellIcon,
      title: 'Instant Price Drop Alerts',
      description: 'Get immediate notifications when prices drop significantly. Never miss a deal with our intelligent alert system.',
      color: 'text-purple-600'
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Price Analytics',
      description: 'View comprehensive price history charts, trend analysis, and price statistics to make informed purchase decisions.',
      color: 'text-orange-600'
    },
    {
      icon: EyeIcon,
      title: 'Smart Dashboard',
      description: 'Manage all your tracked products in one place. See current prices, price changes, and savings at a glance.',
      color: 'text-red-600'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile Responsive',
      description: 'Access your price tracker anywhere with our fully responsive design. Perfect for on-the-go shopping.',
      color: 'text-indigo-600'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      icon: PlusIcon,
      title: 'Add Products',
      description: 'Copy and paste any Amazon product URL. Our scraper automatically extracts the product details, current price, and images.',
      color: 'bg-blue-500'
    },
    {
      step: 2,
      icon: EyeIcon,
      title: 'Monitor Prices',
      description: 'We continuously monitor prices and track historical data. View detailed price charts and trend analysis.',
      color: 'bg-green-500'
    },
    {
      step: 3,
      icon: BellIcon,
      title: 'Get Notified',
      description: 'Receive instant alerts when prices drop significantly. Never miss a deal with our smart notification system.',
      color: 'bg-purple-500'
    },
    {
      step: 4,
      icon: ShoppingCartIcon,
      title: 'Save Money',
      description: 'Buy at the perfect time when prices are at their lowest. Track your savings and make smarter purchasing decisions.',
      color: 'bg-orange-500'
    }
  ];

  const benefits = [
    'Track unlimited Amazon products for free',
    'Get instant price drop notifications',
    'View detailed price history & trends',
    'Advanced price analytics and charts',
    'Mobile-optimized dashboard',
    'Automatic product information extraction',
    'Real-time price monitoring',
    'Smart deal detection algorithms'
  ];

  const stats = [
    { number: '50K+', label: 'Products Tracked' },
    { number: '10K+', label: 'Happy Users' },
    { number: '$2M+', label: 'Money Saved' },
    { number: '99.9%', label: 'Uptime' }
  ];

  const testimonials = [
    {
      text: "PriceTracker saved me $300 on electronics this month! The Amazon URL tracking works perfectly and alerts come instantly.",
      author: "Sarah Johnson",
      role: "Tech Enthusiast",
      rating: 5
    },
    {
      text: "I love how easy it is - just paste the Amazon link and it tracks everything automatically. The price charts are super helpful!",
      author: "Mike Chen",
      role: "Deal Hunter",
      rating: 5
    },
    {
      text: "The mobile dashboard is fantastic. I can check my tracked products anywhere and never miss a price drop.",
      author: "Emma Davis",
      role: "Online Shopper",
      rating: 5
    }
  ];

  return (
    <>
      <SEO
        title="PriceTracker - Amazon Price Monitoring & Alerts | Track Any Amazon Product"
        description="Track Amazon prices automatically with PriceTracker. Simply paste any Amazon URL and get instant alerts when prices drop. Free Amazon price monitoring with real-time charts and notifications."
        keywords="amazon price tracker, amazon price monitoring, price drop alerts, amazon deals, price tracking, amazon url tracker, automatic price monitoring, amazon price history"
        url="/"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mr-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">PriceTracker</h1>
              </div>
              <div className="hidden sm:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-green-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </div>
              {/* Mobile menu button */}
              <div className="sm:hidden">
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
                  <SparklesIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Trusted by 10,000+ shoppers</span>
                </div>
              </div>
              
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
                Track Amazon Prices
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Effortlessly</span>
              </h1>
              
              <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-gray-600 leading-relaxed">
                Never miss a deal again. Automatically track Amazon prices and get instant alerts when prices drop. 
                Simply paste any Amazon product URL and start saving money today - completely free forever.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Start Tracking for Free
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/search"
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  Browse Products
                </Link>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-sm sm:text-base text-gray-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-gray-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
                How PriceTracker Works
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-lg sm:text-xl text-gray-600">
                Start saving money in just 4 simple steps. No complex setup required.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="flex justify-center mb-6">
                      <div className={`flex items-center justify-center w-16 h-16 ${step.color} rounded-2xl shadow-lg`}>
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-200">
                      <span className="text-sm font-bold text-gray-700">{step.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Arrow for desktop */}
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-8 -right-4 z-10">
                      <ArrowRightIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <Link
                to="/register"
                className="inline-flex items-center bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <PlayIcon className="mr-2 h-5 w-5" />
                Try It Now - It's Free!
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
                Powerful Features for Smart Shopping
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-lg sm:text-xl text-gray-600">
                Everything you need to track Amazon prices and save money with our advanced monitoring system
              </p>
            </div>
            
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="relative group">
                  <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2">
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl group-hover:from-white group-hover:to-gray-100 transition-all duration-300">
                        <feature.icon className={`h-8 w-8 ${feature.color}`} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-center leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
                  Start Saving Money Today
                </h2>
                <p className="mt-4 text-lg sm:text-xl text-gray-600">
                  Join thousands of smart shoppers who use PriceTracker to automatically monitor Amazon prices and never miss a deal
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-sm sm:text-base">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link
                    to="/register"
                    className="inline-flex items-center bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Get Started Free
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
              
              <div className="mt-12 lg:mt-0">
                <div className="bg-white p-8 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl">
                      <ChartBarIcon className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Live Price Monitoring</h3>
                    <p className="text-gray-600 mb-6">
                      Our advanced scraping system continuously monitors Amazon prices and updates your dashboard in real-time.
                    </p>
                    
                    {/* Demo Price Card */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">iPhone 15 Pro</span>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">↓ 15% OFF</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-green-600">$849.99</span>
                          <span className="text-sm text-gray-500 line-through ml-2">$999.99</span>
                        </div>
                        <BellIcon className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-xl font-bold text-green-600">$150 Saved!</div>
                      <div className="text-sm text-gray-600">On this product alone</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
                What Our Users Say
              </h2>
              <p className="mt-4 text-lg sm:text-xl text-gray-600">
                Real stories from real savers
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-2xl">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-4 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl mb-4">
              Start Tracking Amazon Prices Today
            </h2>
            <p className="text-lg sm:text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of smart shoppers who save money with automatic price monitoring. Just paste any Amazon URL and we'll do the rest.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Start Tracking for Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 inline-flex items-center justify-center"
              >
                <EyeIcon className="mr-2 h-5 w-5" />
                View Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mr-3">
                    <ChartBarIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white font-bold text-xl">PriceTracker</span>
                </div>
                <p className="text-gray-400 text-sm max-w-md">
                  The ultimate Amazon price tracking tool. Automatically monitor prices, get instant alerts, and save money on your favorite products. Simply paste any Amazon URL and start tracking.
                </p>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Features</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>Amazon URL Tracking</li>
                  <li>Price Drop Alerts</li>
                  <li>Price History Charts</li>
                  <li>Mobile Dashboard</li>
                  <li>Real-time Monitoring</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>Help Center</li>
                  <li>Contact Us</li>
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-400 text-sm">
                © 2025 PriceTracker. All rights reserved. Track prices, save money, shop smarter.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
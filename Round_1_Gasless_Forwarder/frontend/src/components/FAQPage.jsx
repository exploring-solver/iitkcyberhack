import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('general');

  const faqs = [
    {
      question: 'What are gasless transactions?',
      answer:
        'Gasless transactions allow users to send tokens without having ETH for gas fees. The gas fees are covered by a third party (relayer) who forwards the transaction to the network.',
      category: 'general',
    },
    {
      question: 'How do I start using gasless transactions?',
      answer:
        'Simply connect your wallet, select the token you want to send, enter the recipients address, and confirm the transaction. We will handle the gas fees for you!',
      category: 'general',
    },
    {
      question: 'Is there a limit to how many transactions I can make?',
      answer:
        'The number of gasless transactions you can make depends on your account tier and the available gas credits. Check your dashboard for your current limits and usage.',
      category: 'general',
    },
    {
      question: 'How secure are gasless transactions?',
      answer:
        'Our smart contracts are audited by leading security firms and use industry-standard security practices. We never have access to your tokens - we only relay your signed transactions.',
      category: 'security',
    },
    {
      question: 'What tokens are supported?',
      answer:
        'We support most ERC-20 and ERC-721 tokens on the Ethereum network. You can check if your token is supported by entering its contract address in the transfer form.',
      category: 'technical',
    },
    {
      question: 'How do I integrate gasless transactions into my dApp?',
      answer:
        'You can integrate our SDK by installing the @gasless/sdk package and following our developer documentation. We provide examples in JavaScript and Solidity.',
      category: 'technical',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => faq.category === activeCategory);

  return (
    <div className="min-h-screen mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 neon-text">
            <HelpCircle className="w-10 h-10 inline-block mr-4" />
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400">
            Everything you need to know about gasless transactions
          </p>
        </div>

        {/* Category Selection */}
        <div className="flex justify-center mb-8 space-x-2">
          {['general', 'technical', 'security'].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-blue-600 text-white neon-border'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div key={index} className="glass-panel overflow-hidden">
              <button
                className="w-full p-6 text-left flex items-center justify-between"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-blue-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <div
                className={`px-6 transition-all duration-200 ${
                  openIndex === index ? 'pb-6' : 'h-0 overflow-hidden'
                }`}
              >
                <p className="text-gray-400">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <button className="cyber-button">
            Contact Support
            <HelpCircle className="w-5 h-5 inline-block ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
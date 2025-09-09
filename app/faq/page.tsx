"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, Package, CreditCard, ShoppingBag, Store, HelpCircle } from "lucide-react"

const faqData = [
  {
    id: 1,
    question: "How do I place an order?",
    answer:
      "To place an order, browse our collection, select your desired shoes, choose size and color, then add to cart. Proceed to checkout, fill in your shipping details, and complete payment.",
    category: "Orders",
    icon: Package,
  },
  {
    id: 2,
    question: "What payment methods do you accept?",
    answer:
      "We accept major credit cards (Visa, MasterCard, American Express), PayPal, GCash, Maya, and bank transfers. All payments are processed securely.",
    category: "Payment",
    icon: CreditCard,
  },
  {
    id: 3,
    question: "Can I cancel or modify my order?",
    answer:
      "You can cancel or modify your order within 1 hour of placing it. After that, please contact our customer service team for assistance. Orders that have been shipped cannot be modified.",
    category: "Orders",
    icon: Package,
  },
  {
    id: 4,
    question: "How long does shipping take?",
    answer:
      "Standard shipping takes 3-7 business days within Metro Manila and 5-10 business days for provincial areas. Express shipping is available for faster delivery.",
    category: "Orders",
    icon: Package,
  },
  {
    id: 5,
    question: "What is your return policy?",
    answer:
      "We offer a 30-day return policy for unworn items in original packaging. Items must be in new condition with all tags attached. Return shipping costs may apply.",
    category: "Product",
    icon: ShoppingBag,
  },
  {
    id: 6,
    question: "How do I know my shoe size?",
    answer:
      "We provide a detailed size guide on each product page. You can also visit our physical store for professional fitting. If you're between sizes, we recommend sizing up.",
    category: "Product",
    icon: ShoppingBag,
  },
  {
    id: 7,
    question: "Do you have physical stores?",
    answer:
      "Yes, we have physical stores in major malls across the Philippines. Visit our Store Locator page to find the nearest GKicks store to you.",
    category: "Store",
    icon: Store,
  },
  {
    id: 8,
    question: "Are your products authentic?",
    answer:
      "Yes, all our products are 100% authentic. We source directly from authorized distributors and brand partners. Each item comes with authenticity guarantee.",
    category: "Product",
    icon: ShoppingBag,
  },
  {
    id: 9,
    question: "How can I track my order?",
    answer:
      "Once your order ships, you'll receive a tracking number via email and SMS. You can also track your order in the 'My Orders' section of your account.",
    category: "Orders",
    icon: Package,
  },
  {
    id: 10,
    question: "What if I receive a defective item?",
    answer:
      "If you receive a defective item, contact us immediately with photos. We'll arrange for a replacement or full refund. Defective items are covered under our quality guarantee.",
    category: "Product",
    icon: ShoppingBag,
  },
]

const categories = [
  { name: "All", icon: HelpCircle },
  { name: "Orders", icon: Package },
  { name: "Payment", icon: CreditCard },
  { name: "Product", icon: ShoppingBag },
  { name: "Store", icon: Store },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [openItems, setOpenItems] = useState<number[]>([])

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleItem = (id: number) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground dark:text-yellow-400 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Find answers to common questions about our products, orders, and services. Can't find what you're looking
              for? Contact our support team.
            </p>
          </div>

          {/* Search and Filter Section */}
          <Card className="mb-8 border-border bg-card">
            <CardContent className="p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search frequently asked questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <Button
                      key={category.name}
                      variant={selectedCategory === category.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.name)}
                      className={
                        selectedCategory === category.name
                          ? "bg-yellow-400 text-black hover:bg-yellow-500"
                          : "border-border hover:bg-muted text-foreground"
                      }
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {category.name}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <Card className="border-border">
                <CardContent className="text-center py-12">
                  <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No FAQs found</h3>
                  <p className="text-muted-foreground text-sm">Try adjusting your search terms or category filter.</p>
                </CardContent>
              </Card>
            ) : (
              filteredFAQs.map((faq) => {
                const Icon = faq.icon
                const isOpen = openItems.includes(faq.id)
                return (
                  <Card key={faq.id} className="border-border bg-card hover:shadow-md transition-shadow">
                    <Collapsible>
                      <CollapsibleTrigger className="w-full" onClick={() => toggleItem(faq.id)}>
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                                <Icon className="h-5 w-5 text-black" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-base sm:text-lg text-foreground">{faq.question}</CardTitle>
                                <Badge variant="secondary" className="mt-1 text-xs bg-muted text-muted-foreground">
                                  {faq.category}
                                </Badge>
                              </div>
                            </div>
                            <ChevronDown
                              className={`h-5 w-5 text-muted-foreground transition-transform ${
                                isOpen ? "transform rotate-180" : ""
                              }`}
                            />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="ml-13 pl-3 border-l-2 border-yellow-400">
                            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{faq.answer}</p>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )
              })
            )}
          </div>

          {/* Contact Support */}
          <Card className="mt-12 border-border bg-card">
            <CardContent className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Still need help?</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Our customer support team is here to help you with any questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() => (window.location.href = "mailto:support@gkicks.com")}
                >
                  Email Support
                </Button>
                <Button
                  variant="outline"
                  className="border-border hover:bg-muted text-foreground bg-transparent"
                  onClick={() => (window.location.href = "tel:+63-2-8123-KICK")}
                >
                  Call Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

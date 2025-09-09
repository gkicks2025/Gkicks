"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit, Trash2, Search, BookOpen, Brain, MessageSquare } from "lucide-react"
import { faqData, getFAQCategories, searchFAQ, type FAQItem } from "@/lib/faq-data"
import { toast } from "sonner"

export function FAQManager() {
  const [faqs, setFaqs] = useState<FAQItem[]>(faqData)
  const [filteredFaqs, setFilteredFaqs] = useState<FAQItem[]>(faqData)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null)
  const [newFaq, setNewFaq] = useState<Partial<FAQItem> & { keywords: string | string[] }>({
    category: '',
    question: '',
    answer: '',
    keywords: [] as string[],
    priority: 'medium'
  })

  const categories = getFAQCategories()

  // Filter FAQs based on search and category
  useEffect(() => {
    let filtered = faqs

    if (searchQuery) {
      filtered = searchFAQ(searchQuery)
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory)
    }

    setFilteredFaqs(filtered)
  }, [searchQuery, selectedCategory, faqs])

  const handleAddFaq = () => {
    if (!newFaq.question || !newFaq.answer || !newFaq.category) {
      toast.error('Please fill in all required fields')
      return
    }

    const faqToAdd: FAQItem = {
      id: `custom-${Date.now()}`,
      category: newFaq.category,
      question: newFaq.question,
      answer: newFaq.answer,
      keywords: typeof newFaq.keywords === 'string' 
        ? newFaq.keywords.split(',').map((k: string) => k.trim()) 
        : newFaq.keywords || [],
      priority: newFaq.priority as 'high' | 'medium' | 'low'
    }

    setFaqs([...faqs, faqToAdd])
    setNewFaq({
      category: '',
      question: '',
      answer: '',
      keywords: [] as string[],
      priority: 'medium'
    })
    setIsAddDialogOpen(false)
    toast.success('FAQ added successfully!')
  }

  const handleEditFaq = (faq: FAQItem) => {
    setEditingFaq(faq)
    setNewFaq({
      ...faq,
      keywords: faq.keywords.join(', ') as string[] & string
    })
  }

  const handleUpdateFaq = () => {
    if (!editingFaq || !newFaq.question || !newFaq.answer || !newFaq.category) {
      toast.error('Please fill in all required fields')
      return
    }

    const updatedFaq: FAQItem = {
      ...editingFaq,
      category: newFaq.category,
      question: newFaq.question,
      answer: newFaq.answer,
      keywords: typeof newFaq.keywords === 'string' 
        ? newFaq.keywords.split(',').map(k => k.trim()) 
        : newFaq.keywords || [],
      priority: newFaq.priority as 'high' | 'medium' | 'low'
    }

    setFaqs(faqs.map(faq => faq.id === editingFaq.id ? updatedFaq : faq))
    setEditingFaq(null)
    setNewFaq({
      category: '',
      question: '',
      answer: '',
      keywords: [] as string[],
      priority: 'medium'
    })
    toast.success('FAQ updated successfully!')
  }

  const handleDeleteFaq = (id: string) => {
    setFaqs(faqs.filter(faq => faq.id !== id))
    toast.success('FAQ deleted successfully!')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const FAQForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select 
          value={newFaq.category} 
          onValueChange={(value) => setNewFaq({...newFaq, category: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
            <SelectItem value="new-category">+ Add New Category</SelectItem>
          </SelectContent>
        </Select>
        {newFaq.category === 'new-category' && (
          <Input
            className="mt-2"
            placeholder="Enter new category name"
            value={newFaq.category === 'new-category' ? '' : newFaq.category}
            onChange={(e) => setNewFaq({...newFaq, category: e.target.value})}
          />
        )}
      </div>

      <div>
        <Label htmlFor="question">Question *</Label>
        <Input
          id="question"
          value={newFaq.question}
          onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
          placeholder="Enter the FAQ question"
        />
      </div>

      <div>
        <Label htmlFor="answer">Answer *</Label>
        <Textarea
          id="answer"
          value={newFaq.answer}
          onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
          placeholder="Enter the detailed answer"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
        <Input
          id="keywords"
          value={Array.isArray(newFaq.keywords) ? newFaq.keywords.join(', ') : (newFaq.keywords || '')}
          onChange={(e) => setNewFaq({...newFaq, keywords: e.target.value.split(',').map(k => k.trim())})}
          placeholder="e.g., shipping, delivery, cost, free"
        />
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select 
          value={newFaq.priority} 
          onValueChange={(value) => setNewFaq({...newFaq, priority: value as 'high' | 'medium' | 'low'})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">AI FAQ Training Manager</h1>
            <p className="text-muted-foreground">Manage your chatbot's knowledge base</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New FAQ</DialogTitle>
            </DialogHeader>
            <FAQForm />
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFaq} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                Add FAQ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Manage FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Test Search</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Statistics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FAQ List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredFaqs.map((faq) => (
                <Card key={faq.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{faq.question}</CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{faq.category}</Badge>
                          <Badge className={getPriorityColor(faq.priority)}>
                            {faq.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditFaq(faq)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">{faq.answer}</p>
                    <div className="flex flex-wrap gap-1">
                      {faq.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test FAQ Search</CardTitle>
              <p className="text-muted-foreground">
                Test how your AI will find relevant FAQs based on user queries
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter a test query (e.g., 'How much is shipping?')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Search Results:</h4>
                  {searchFAQ(searchQuery).slice(0, 3).map((faq, index) => (
                    <Card key={faq.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getPriorityColor(faq.priority)}>#{index + 1} - {faq.priority}</Badge>
                        <Badge variant="outline">{faq.category}</Badge>
                      </div>
                      <h5 className="font-medium mb-1">{faq.question}</h5>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total FAQs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">{faqs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">{categories.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">
                  {faqs.filter(faq => faq.priority === 'high').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map(category => {
                  const count = faqs.filter(faq => faq.category === category).length
                  const percentage = (count / faqs.length * 100).toFixed(1)
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingFaq} onOpenChange={() => setEditingFaq(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
          </DialogHeader>
          <FAQForm />
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setEditingFaq(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFaq} className="bg-yellow-400 hover:bg-yellow-500 text-black">
              Update FAQ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
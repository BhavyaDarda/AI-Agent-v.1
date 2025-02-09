"use client"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import axios from "axios"
import * as cheerio from "cheerio"
import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Send } from "lucide-react"

const model = openai("gpt-4-turbo")

async function summarizeText(text: string): Promise<string> {
  const { text: summary } = await generateText({
    model,
    system: "You are an expert summarizer. Provide concise summaries.",
    prompt: `Summarize the following text in a few sentences: ${text}`,
  })
  return summary
}

async function generateReport(topic: string): Promise<string> {
  const { text: report } = await generateText({
    model,
    system: "You are a professional report writer. Create detailed and well-structured reports.",
    prompt: `Generate a brief report on the following topic: ${topic}`,
  })
  return report
}

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const text = $("body").text()
    return text.slice(0, 1000)
  } catch (error) {
    console.error("Error scraping website:", error)
    return "Failed to scrape website."
  }
}

async function writeEmail(subject: string, recipient: string, content: string): Promise<string> {
  const { text: email } = await generateText({
    model,
    system: "You are an expert email writer. Write professional and concise emails.",
    prompt: `Write an email with the following details:
    Subject: ${subject}
    Recipient: ${recipient}
    Content: ${content}`,
  })
  return email
}

async function handleUserRequest(request: string): Promise<string> {
  const { text: response } = await generateText({
    model,
    system:
      "You are an AI assistant capable of summarizing texts, generating reports, web scraping, writing emails, and performing other basic tasks. Respond to the user's request and call the appropriate function if needed.",
    prompt: request,
  })
  return response
}

export default function AIAgent() {
  const [conversation, setConversation] = useState<Array<{ role: "user" | "ai"; content: string }>>([])
  const [userInput, setUserInput] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(prefersDark)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    setConversation([...conversation, { role: "user", content: userInput }])
    setUserInput("")
    setIsLoading(true)

    const response = await handleUserRequest(userInput)
    setConversation((prev) => [...prev, { role: "ai", content: response }])
    setIsLoading(false)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? "dark bg-gray-900" : "bg-gray-100"}`}
    >
      <div className="flex-1 container mx-auto p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>AI Agent</h1>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${isDarkMode ? "bg-gray-800 text-yellow-300" : "bg-gray-200 text-gray-800"}`}
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
        <div
          className={`flex-1 overflow-y-auto mb-4 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}
        >
          <AnimatePresence>
            {conversation.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.role === "user"
                      ? isDarkMode
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-900"
                      : isDarkMode
                        ? "bg-gray-700 text-gray-100"
                        : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              AI is thinking...
            </motion.div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className={`flex-grow p-3 rounded-l-lg focus:outline-none ${
              isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"
            }`}
            placeholder="Enter your request..."
          />
          <button
            type="submit"
            className={`p-3 rounded-r-lg ${
              isDarkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
            } text-white transition-colors duration-300`}
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  )
}


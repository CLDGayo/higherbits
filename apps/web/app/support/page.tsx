"use client"

import React, { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/header.client"

export default function SupportPage() {
  const [amount, setAmount] = useState<number>(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSupport = async () => {
    if (amount < 5) {
      setError("Minimum amount is $5")
      return
    }
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/stripe/create-support-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-md mx-auto pt-32 px-4">
        <div className="bg-card text-card-foreground p-8 rounded-xl border shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Support Us!</h1>
          <p className="text-muted-foreground mb-6">
            Monthly recurring support. Your contribution helps us keep building.
          </p>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium">Select Amount</label>
                <span className="text-2xl font-bold">${amount}</span>
              </div>
              
              <input 
                type="range" 
                min="5" 
                max="100" 
                step="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Custom Amount ($)</label>
              <input 
                type="number" 
                min="5"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSupport}
              disabled={loading || amount < 5}
            >
              {loading ? "Processing..." : `Support $${amount} / month`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

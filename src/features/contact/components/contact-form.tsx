import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ContactForm() {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")

  // TODO: Replace this URL with your actual API Gateway URL
  const API_ENDPOINT =
    ""; 

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(""); // Clear any previous messages

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          projectType: formData.get("projectType"),
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);
        setMessage(data.message);
        form.reset();
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="bg-orange-950/20 border-orange-800/30">
      <CardHeader>
        <CardTitle className="text-orange-300">Start Your Project</CardTitle>
        <CardDescription className="text-orange-200">
          Tell us about your vision and we'll help bring it to life.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-orange-300 mb-2 block">Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 bg-black/50 border border-orange-800/50 rounded-md text-orange-100 focus:border-orange-600 focus:outline-none"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-orange-300 mb-2 block">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 bg-black/50 border border-orange-800/50 rounded-md text-orange-100 focus:border-orange-600 focus:outline-none"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-orange-300 mb-2 block">Project Type</label>
          <select className="w-full px-3 py-2 bg-black/50 border border-orange-800/50 rounded-md text-orange-100 focus:border-orange-600 focus:outline-none">
            <option>UI/UX Design</option>
            <option>Dashboard & Reporting</option>
            <option>Custom Software</option>
            <option>Full Stack Development</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-orange-300 mb-2 block">Message</label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 bg-black/50 border border-orange-800/50 rounded-md text-orange-100 focus:border-orange-600 focus:outline-none resize-none"
            placeholder="Tell us about your project..."
          />
        </div>
        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">Send Message</Button>
      </CardContent>
    </Card>
  )
}

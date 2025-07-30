import { Mail, Phone, MapPin } from "lucide-react"

export function ContactInfo() {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-orange-300 mb-6">Get in Touch</h3>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
            <Mail className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <p className="text-orange-300 font-medium">Email</p>
            <p className="text-orange-200">contact@enchiridiontech.com</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
            <Phone className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <p className="text-orange-300 font-medium">Phone</p>
            <p className="text-orange-200">+1 (555) 123-4567</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
            <MapPin className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <p className="text-orange-300 font-medium">Location</p>
            <p className="text-orange-200">Remote & On-site Worldwide</p>
          </div>
        </div>
      </div>
    </div>
  )
}

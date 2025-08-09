import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, Briefcase, Calculator, Building, House } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Exterior Finishes</h1>
                <p className="text-sm text-slate-500">CRM System</p>
              </div>
            </div>
            <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Manage Your Siding Business with Confidence
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Streamline your customer relationships, track jobs, and manage estimates 
            across residential and commercial divisions with our comprehensive CRM system.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Everything You Need to Run Your Business
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center">
                  Keep detailed records of all your customers with contact information, 
                  job history, and communication logs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Job Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center">
                  Monitor project progress from planning to completion with 
                  status updates and milestone tracking.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-6 h-6 text-amber-600" />
                </div>
                <CardTitle>Estimate Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center">
                  Generate professional estimates quickly and track their 
                  status from draft to approval.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Division Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center">
                  Organize your business by residential and commercial 
                  divisions with separate workflows.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h3>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of contractors who trust our CRM to manage their operations.
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
              <Home className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Exterior Finishes CRM</span>
          </div>
          <p className="text-slate-500">
            © 2024 Exterior Finishes. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useUser, UserButton } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import Footer from "@/components/Footer";
import MerchantsApprovalTab from "@/components/admin/MerchantsApprovalTab";
import EcommerceTab from "@/components/merchant-admin/EcommerceTab";
import RulesTab from "@/components/merchant-admin/RulesTab";
import Logo from "@/components/Logo";

const Admin = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("merchants");

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isLoaded || !user) return;

      try {
        // Check if user is admin
        const response = await fetch(`http://localhost:3001/api/users/${user.id}`);

        if (response.ok) {
          const dbUser = await response.json();

          if (!dbUser.isAdmin) {
            navigate('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, isLoaded, navigate]);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg p-4 md:p-8 flex flex-col">
      <div className="w-full max-w-[1280px] mx-auto flex-grow flex flex-col">
        {/* Logo */}
        <Logo />

        {/* Page Title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Application Admin Dashboard
          </h1>
        </div>

        {/* Header */}
        <div className="flex justify-end items-center gap-3 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Button>
          <div className="relative bg-background/60 backdrop-blur-xl rounded-full p-1 border border-white/20 shadow-lg leading-[0]">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl",
                  userButtonPopoverActionButton: "hover:bg-gray-100 text-gray-900 transition-colors",
                  userButtonPopoverActionButtonText: "text-gray-900 font-medium",
                  userButtonPopoverActionButtonIcon: "text-primary",
                  userButtonPopoverFooter: "hidden",
                  userPreviewMainIdentifier: "text-gray-900 font-semibold",
                  userPreviewSecondaryIdentifier: "text-gray-600",
                },
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden mb-auto"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-white/5 border-b border-white/10 rounded-none p-0">
              <TabsTrigger
                value="merchants"
                className="flex-1 md:flex-none data-[state=active]:bg-white/10 data-[state=active]:text-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Merchants
              </TabsTrigger>
              <TabsTrigger
                value="ecommerce"
                className="flex-1 md:flex-none data-[state=active]:bg-white/10 data-[state=active]:text-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Ecommerce Platforms
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="flex-1 md:flex-none data-[state=active]:bg-white/10 data-[state=active]:text-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Business Rules
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="merchants" className="mt-0">
                <MerchantsApprovalTab />
              </TabsContent>

              <TabsContent value="ecommerce" className="mt-0">
                <EcommerceTab />
              </TabsContent>

              <TabsContent value="rules" className="mt-0">
                <RulesTab />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Admin;

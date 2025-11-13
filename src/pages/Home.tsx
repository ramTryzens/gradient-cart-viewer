import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { ShoppingCart, LogIn, UserPlus, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

const Home = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Insights",
      description: "Smart recommendations and personalized rewards based on customer behavior"
    },
    {
      icon: TrendingUp,
      title: "Real-Time Analytics",
      description: "Track cart performance and conversion rates with live dashboards"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your customer data and transactions"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance for seamless shopping experiences"
    }
  ];

  // Glow pulse animation
  const glowAnimation = {
    animate: {
      boxShadow: [
        "0 0 20px rgba(139, 92, 246, 0.3)",
        "0 0 40px rgba(139, 92, 246, 0.6)",
        "0 0 20px rgba(139, 92, 246, 0.3)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg p-4 md:p-8 relative overflow-hidden flex flex-col">
      {/* Animated floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        />
      ))}

      <div className="w-full max-w-[1280px] mx-auto relative z-10 flex-grow flex flex-col">
        {/* Logo */}
        <Logo />

        {/* Header */}
        {isLoaded && isSignedIn && (
          <div className="flex justify-end mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground"
            >
              Go to Dashboard →
            </Button>
          </div>
        )}

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8 md:p-12 mb-8 text-center overflow-hidden"
        >
          {/* Animated Background Orbs */}
          <motion.div
            className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-tl from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="mb-6 inline-block"
            >
              <motion.div
                className="bg-gradient-primary rounded-full p-4"
                variants={glowAnimation}
                animate="animate"
              >
                <div>
                  <ShoppingCart className="w-12 h-12 text-white" />
                </div>
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight"
            >
              Welcome to{" "}
              <motion.span
                className="bg-gradient-primary bg-clip-text text-transparent inline-block"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                Reward AI
              </motion.span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Experience the future of e-commerce with AI-powered cart management and intelligent customer rewards
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {isLoaded && isSignedIn ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={() => navigate("/dashboard")}
                    className="font-semibold"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="hero"
                      size="lg"
                      onClick={() => navigate("/sign-in")}
                      className="font-semibold"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate("/sign-up")}
                      className="font-semibold bg-white/5 dark:bg-white/5 border-foreground/30 dark:border-white/20 hover:bg-white/10 dark:hover:bg-white/10"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Sign Up
                    </Button>
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-auto"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className="group relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Hover gradient effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />

                <div className="relative z-10">
                  <motion.div
                    className="bg-gradient-primary rounded-full p-3 w-fit mb-4"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Animated corner accent */}
                <motion.div
                  className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Home;
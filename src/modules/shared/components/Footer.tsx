import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Heart, BookOpen, Mail, ExternalLink } from "lucide-react";

export const Footer = () => {
  const footerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.footer
      className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-t border-gray-200/50 mt-16"
      variants={footerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className="h-6 w-6 text-purple-500" />
              </motion.div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                FlipMyEra
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Rewrite your story in a kinder, pre-2020 timeline where dreams felt limitless.
            </p>
            <div className="flex space-x-3">
              <motion.a
                href="#"
                className="text-gray-400 hover:text-purple-500 transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <ExternalLink className="h-5 w-5" />
              </motion.a>
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="font-semibold text-gray-900">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-purple-600 transition-colors hover:underline"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/plans"
                  className="text-gray-600 hover:text-purple-600 transition-colors hover:underline"
                >
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-600 hover:text-purple-600 transition-colors hover:underline"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="font-semibold text-gray-900">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:support@flipmyera.com"
                  className="text-gray-600 hover:text-purple-600 transition-colors hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  Contact Us
                </a>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-600 hover:text-purple-600 transition-colors hover:underline"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <span className="text-gray-600">Community</span>
              </li>
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors hover:underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors hover:underline">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors hover:underline">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          variants={itemVariants}
          className="border-t border-gray-200/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-4 md:mb-0">
            <span>Built with</span>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Heart className="h-4 w-4 text-red-500 fill-current" />
            </motion.div>
            <span>for storytellers</span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>© 2025 FlipMyEra. All rights reserved.</span>
            <motion.div
              className="flex items-center space-x-1"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <BookOpen className="h-4 w-4" />
              <span>Rewriting stories, one timeline at a time</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

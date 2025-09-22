
import { Sparkles, Clock, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export const PageHeader = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      className="text-center space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="space-y-4" variants={itemVariants}>
        <motion.h1
          className="text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 font-bold relative"
          variants={titleVariants}
        >
          <motion.span
            className="inline-block"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              background: "linear-gradient(45deg, #9333ea, #ec4899, #3b82f6)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            ✨ FlipMyEra ✨
          </motion.span>
          <motion.div
            className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-lg blur-xl -z-10"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.h1>
        <motion.p
          className="text-xl text-gray-700 max-w-2xl mx-auto"
          variants={itemVariants}
        >
          Rewrite your story in a kinder, pre-2020 timeline
          <motion.span
            className="block mt-2 text-lg italic text-purple-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            Where festivals were endless, summers were perfect and dreams felt limitless.
          </motion.span>
        </motion.p>
      </motion.div>

      <motion.div
        className="flex flex-wrap justify-center gap-8 text-gray-600"
        variants={containerVariants}
      >
        {[
          { icon: Sparkles, text: "AI Magic Storytelling", color: "text-purple-500", emoji: "✨" },
          { icon: Clock, text: "Time-Travel Narratives", color: "text-pink-500", emoji: "⏰" },
          { icon: BookOpen, text: "Memory Books That Hit Different", color: "text-blue-500", emoji: "📚" }
        ].map((item, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow"
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgba(255, 255, 255, 0.8)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: index * 0.5,
                ease: "easeInOut"
              }}
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </motion.div>
            <span className="font-medium">{item.emoji} {item.text}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

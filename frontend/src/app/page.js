"use client";
import React from "react";
import { useState, useMemo, Fragment } from "react";
import {
  GraduationCap,
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Users,
  School,
  Heart,
  Gamepad2,
  Clock,
  BookOpen,
  Wifi,
  Baby,
  Info,
  ChevronRight,
  ChevronLeft,
  Loader,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// #region UTILS AND CONSTANTS
// In a real app, these would be in separate files (e.g., `lib/constants.js`)

const fieldMetadata = {
  // Academic
  studytime: {
    label: "Weekly Study Time",
    icon: Clock,
    tooltip: "Hours spent studying per week (1: <2, 2: 2-5, 3: 5-10, 4: >10).",
    type: "numeric",
    max: 4,
  },
  failures: {
    label: "Past Class Failures",
    icon: AlertTriangle,
    tooltip: "Number of past class failures (n if 1<=n<4, else 4).",
    type: "numeric",
    max: 4,
  },
  absences: {
    label: "School Absences",
    icon: School,
    tooltip: "Number of school absences (0 to 93).",
    type: "numeric",
    max: 93,
  },
  schoolsup: {
    label: "Extra Educational Support",
    icon: School,
    tooltip: "Does the student receive extra educational support?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  paid: {
    label: "Extra Paid Classes",
    icon: BookOpen,
    tooltip: "Are there extra paid classes within the course subject?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  activities: {
    label: "Extra-curricular Activities",
    icon: Gamepad2,
    tooltip: "Does the student do extra-curricular activities?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  higher: {
    label: "Wants Higher Education",
    icon: GraduationCap,
    tooltip: "Does the student want to take higher education?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  reason: {
    label: "Reason for School Choice",
    icon: Brain,
    tooltip: "Reason to choose this school.",
    type: "select",
    options: [
      { value: "course", label: "Course Preference" },
      { value: "home", label: "Close to Home" },
      { value: "reputation", label: "School Reputation" },
      { value: "other", label: "Other" },
    ],
  },
  // Family
  famsup: {
    label: "Family Educational Support",
    icon: Users,
    tooltip: "Does the family provide educational support?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  Medu: {
    label: "Mother's Education",
    icon: Users,
    tooltip: "Mother's education level (0-4).",
    type: "numeric",
    max: 4,
  },
  Fedu: {
    label: "Father's Education",
    icon: Users,
    tooltip: "Father's education level (0-4).",
    type: "numeric",
    max: 4,
  },
  famrel: {
    label: "Family Relationship Quality",
    icon: Heart,
    tooltip: "Quality of family relationships (1: Very Bad - 5: Excellent).",
    type: "numeric",
    max: 5,
  },
  Pstatus: {
    label: "Parents' Cohabitation",
    icon: Users,
    tooltip: "Parent's cohabitation status.",
    type: "select",
    options: [
      { value: "T", label: "Together" },
      { value: "A", label: "Apart" },
    ],
  },
  // Lifestyle
  health: {
    label: "Current Health Status",
    icon: Heart,
    tooltip: "Current health status (1: Very Bad - 5: Very Good).",
    type: "numeric",
    max: 5,
  },
  goout: {
    label: "Going Out Frequency",
    icon: Gamepad2,
    tooltip:
      "Frequency of going out with friends (1: Very Low - 5: Very High).",
    type: "numeric",
    max: 5,
  },
  Dalc: {
    label: "Workday Alcohol Consumption",
    icon: AlertTriangle,
    tooltip: "Workday alcohol consumption (1: Very Low - 5: Very High).",
    type: "numeric",
    max: 5,
  },
  Walc: {
    label: "Weekend Alcohol Consumption",
    icon: AlertTriangle,
    tooltip: "Weekend alcohol consumption (1: Very Low - 5: Very High).",
    type: "numeric",
    max: 5,
  },
  freetime: {
    label: "Free Time After School",
    icon: Clock,
    tooltip: "Amount of free time after school (1: Very Low - 5: Very High).",
    type: "numeric",
    max: 5,
  },
  romantic: {
    label: "In a Romantic Relationship",
    icon: Heart,
    tooltip: "Is the student in a romantic relationship?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  // Background
  internet: {
    label: "Home Internet Access",
    icon: Wifi,
    tooltip: "Does the student have internet access at home?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  nursery: {
    label: "Attended Nursery School",
    icon: Baby,
    tooltip: "Did the student attend nursery school?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
};

const formSections = [
  {
    title: "Academic Factors",
    icon: BookOpen,
    fields: [
      "studytime",
      "failures",
      "absences",
      "schoolsup",
      "paid",
      "activities",
      "higher",
      "reason",
    ],
  },
  {
    title: "Family Background",
    icon: Users,
    fields: ["famsup", "Medu", "Fedu", "famrel", "Pstatus"],
  },
  {
    title: "Lifestyle & Social",
    icon: Heart,
    fields: ["health", "goout", "Dalc", "Walc", "freetime", "romantic"],
  },
  {
    title: "Early Background",
    icon: Wifi,
    fields: ["internet", "nursery"],
  },
];

// #endregion

// #region SUB-COMPONENTS
// In a real app, these would be in separate files (e.g., `components/Tooltip.jsx`)

const CustomTooltip = ({ content, children }) => (
  <div className="group relative flex items-center">
    {children}
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none dark:bg-gray-700">
      {content}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700"
        aria-hidden="true"
      ></div>
    </div>
  </div>
);

const FormField = ({ name, value, onChange, metadata }) => {
  const { label, icon: Icon, tooltip, type, options, max } = metadata;
  const id = `field-${name}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        <CustomTooltip content={tooltip}>
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
        </CustomTooltip>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        {type === "numeric" ? (
          <input
            type="number"
            name={name}
            id={id}
            value={value}
            onChange={onChange}
            min="0"
            max={max}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-shadow duration-200 focus:shadow-lg"
            placeholder={`0-${max}`}
          />
        ) : (
          <select
            name={name}
            id={id}
            value={value}
            onChange={onChange}
            className="block w-full appearance-none rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white pl-10 pr-10 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-shadow duration-200 focus:shadow-lg"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

const FormStepper = ({ sections, currentIndex, setCurrentIndex }) => (
  <nav aria-label="Progress">
    <ol
      role="list"
      className="flex items-center justify-center space-x-2 md:space-x-4"
    >
      {sections.map((section, index) => (
        <Fragment key={section.title}>
          {index > 0 && (
            <div className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
          )}
          <li
            className={`cursor-pointer ${
              index > currentIndex ? "opacity-50" : ""
            }`}
            onClick={() => setCurrentIndex(index)}
          >
            {index < currentIndex ? (
              <div className="flex flex-col items-center space-y-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
                  <CheckCircle
                    className="h-5 w-5 text-white"
                    aria-hidden="true"
                  />
                </span>
                <span className="hidden md:block text-xs font-medium text-gray-600 dark:text-gray-400">
                  {section.title}
                </span>
              </div>
            ) : index === currentIndex ? (
              <div className="flex flex-col items-center space-y-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                </span>
                <span className="hidden md:block text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {section.title}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                </span>
                <span className="hidden md:block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {section.title}
                </span>
              </div>
            )}
          </li>
        </Fragment>
      ))}
    </ol>
  </nav>
);

const ResultSkeleton = () => (
  <div className="w-full space-y-6 animate-pulse">
    <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-300 dark:bg-gray-700"></div>
    <div className="h-8 w-3/4 mx-auto rounded-lg bg-gray-300 dark:bg-gray-700"></div>
    <div className="h-12 w-1/2 mx-auto rounded-lg bg-gray-300 dark:bg-gray-700"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-600"></div>
      <div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-600"></div>
    </div>
    <div className="space-y-2 pt-4">
      <div className="h-6 w-1/3 rounded-lg bg-gray-300 dark:bg-gray-700"></div>
      <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-600"></div>
      <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-600"></div>
    </div>
    <div className="space-y-2 pt-4">
      <div className="h-6 w-1/3 rounded-lg bg-gray-300 dark:bg-gray-700"></div>
      <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-600"></div>
      <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-600"></div>
    </div>
  </div>
);
const PredictionResult = ({ result }) => {
  const isPass = result.result === "Pass";
  const gradientClass = isPass
    ? "from-emerald-400 via-green-500 to-emerald-600"
    : "from-red-400 via-red-500 to-red-600";
  const textClass = isPass
    ? "text-emerald-800 dark:text-emerald-300"
    : "text-red-800 dark:text-red-300";
  const bgClass = isPass
    ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 border-emerald-200 dark:border-emerald-800"
    : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 border-red-200 dark:border-red-800";
  const glowClass = "";
  const ResultIcon = isPass ? CheckCircle : XCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`w-full space-y-8 ${glowClass} transition-all duration-300`}
    >
      {/* Main Result Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        </div>

        <div className="relative text-center">
          {/* Icon with enhanced styling */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.4,
              duration: 0.6,
              type: "spring",
              stiffness: 150,
            }}
            className={`w-20 h-20 bg-gradient-to-br ${gradientClass} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-sm border border-white/20`}
          >
            <TrendingUp className="w-10 h-10 text-white drop-shadow-sm" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-6"
          >
            Prediction Result
          </motion.h2>

          {/* Result Display with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className={`rounded-2xl p-6 mb-6 backdrop-blur-sm border-2 ${bgClass} relative overflow-hidden`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="flex items-center justify-center space-x-3">
              <ResultIcon className={`w-8 h-8 ${textClass}`} />
              <p className={`text-4xl font-bold ${textClass} tracking-wide`}>
                {result.result}
              </p>
            </div>
          </motion.div>

          {/* Stats Grid with enhanced cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-2xl p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Probability
                </p>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {result.probability}
              </p>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-2xl p-4 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Confidence
                </p>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {result.confidence}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Risk Factors Section */}
      {result.risk_factors && Object.keys(result.risk_factors).length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Risk Factors
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent dark:from-orange-800" />
          </div>
          <div className="space-y-3">
            {Object.entries(result.risk_factors).map(([k, v], index) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
                className="group p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border-l-4 border-orange-400 hover:shadow-md transition-all duration-300 hover:border-orange-500"
              >
                <div className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                  {k}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                  {v}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations Section */}
      {result.recommendations && result.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
              <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Recommendations
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-yellow-200 to-transparent dark:from-yellow-800" />
          </div>
          <div className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1, duration: 0.4 }}
                className="group flex items-start space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-all duration-300"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-yellow-900">
                    {index + 1}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {rec}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
// #endregion

export default function Home() {
  const [formData, setFormData] = useState({
    studytime: 2,
    failures: 0,
    absences: 0,
    health: 4,
    schoolsup: "no",
    famsup: "yes",
    paid: "no",
    activities: "no",
    higher: "yes",
    Medu: 3,
    Fedu: 3,
    famrel: 4,
    Pstatus: "T",
    goout: 2,
    Dalc: 1,
    Walc: 1,
    freetime: 2,
    romantic: "no",
    internet: "yes",
    nursery: "yes",
    reason: "course",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setError(null);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleNext = () => {
    if (currentSectionIndex < formSections.length - 1) {
      setCurrentSectionIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((i) => i - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setResult(null);
    setError(null);

    // Basic Validation
    for (const section of formSections) {
      for (const fieldName of section.fields) {
        const meta = fieldMetadata[fieldName];
        const value = formData[fieldName];
        if (meta.type === "numeric" && (value < 0 || value > meta.max)) {
          setError(
            `Invalid value for ${meta.label}. Please enter a number between 0 and ${meta.max}.`
          );
          setLoading(false);
          // Find which section this field belongs to and navigate there
          const sectionIndex = formSections.findIndex((s) =>
            s.fields.includes(fieldName)
          );
          if (sectionIndex !== -1) setCurrentSectionIndex(sectionIndex);
          return;
        }
      }
    }

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: AbortSignal.timeout(15000), // 15-second timeout
      });

      if (!response.ok) {
        // Handle non-2xx responses
        let errorMsg = "An unknown error occurred.";
        try {
          const errorData = await response.json();
          if (typeof errorData.detail === "string") {
            errorMsg = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            // FastAPI validation errors
            errorMsg = errorData.detail.map((d) => d.msg).join("; ");
          }
        } catch {
          errorMsg = `HTTP error! Status: ${response.status}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      if (err.name === "TimeoutError") {
        setError(
          "Prediction request timed out. The server might be busy. Please try again later."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Prediction failed. Please check your connection or contact support."
        );
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentSection = useMemo(
    () => formSections[currentSectionIndex],
    [currentSectionIndex]
  );

  // To implement dark mode, you would have a state, e.g., `const [theme, setTheme] = useState('light')`
  // and toggle a 'dark' class on the `<html>` element.
  // Example: `useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme]);`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-500">
      <main className="container mx-auto px-4 py-8 md:py-16 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl mb-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">
              <GraduationCap className="w-10 h-10 text-indigo-500" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
            Student Performance Predictor
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Harness AI to gain insights into academic outcomes and discover
            actionable recommendations for success.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 xl:gap-12">
          {/* Form Section */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-8">
              <FormStepper
                sections={formSections}
                currentIndex={currentSectionIndex}
                setCurrentIndex={setCurrentSectionIndex}
              />

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSectionIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-5 mb-6">
                      <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white flex items-center">
                        <currentSection.icon className="w-6 h-6 mr-3 text-indigo-500" />
                        {currentSection.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Section {currentSectionIndex + 1} of{" "}
                        {formSections.length}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {currentSection.fields.map((key) => (
                        <FormField
                          key={key}
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          metadata={fieldMetadata[key]}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center space-x-3"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentSectionIndex === 0 || loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Previous
                  </button>

                  {currentSectionIndex === formSections.length - 1 ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-wait transition-all transform hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 mr-3 -ml-1 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-5 h-5 mr-3 -ml-1" />
                          Predict Performance
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                    >
                      Next
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <ResultSkeleton />
                    </motion.div>
                  ) : result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <PredictionResult result={result} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-gray-500 dark:text-gray-400 py-12"
                    >
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Ready for Analysis
                      </h3>
                      <p className="text-sm">
                        Complete the form to view the AI-powered prediction and
                        recommendations here.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="w-full py-6 flex justify-center items-center bg-transparent mt-12">
        <div className="text-center text-gray-500 text-sm">
          ©{" "}
          <span className="font-semibold text-indigo-600">Mohammed Shaaz</span>{" "}
          &middot; Created using{" "}
          <span className="font-semibold text-blue-600">Next.js</span> and{" "}
          <span className="font-semibold text-green-600">Python</span>
        </div>
      </footer>
      {/* Required for Framer Motion */}
      <script src="https://cdn.jsdelivr.net/npm/framer-motion@10.16.4/dist/framer-motion.umd.min.js"></script>
    </div>
  );
}

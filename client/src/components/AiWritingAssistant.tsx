import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, RefreshCw, Check, ChevronRight } from 'lucide-react';

type FieldType = 'greeting' | 'closingMessage' | 'groomPersonality' | 'bridePersonality' | 'secret' | 'qnaAnswer';

interface Question {
  id: string;
  question: string;
  options?: string[];
}

interface Props {
  fieldType: FieldType;
  context: {
    groomName?: string;
    brideName?: string;
    weddingDate?: string;
    venue?: string;
    secretType?: string;
    question?: string;
  };
  onSelect: (value: string) => void;
  placeholder?: string;
}

const FIELD_LABELS: Record<FieldType, string> = {
  greeting: '인사말',
  closingMessage: '마무리 인사',
  groomPersonality: '신랑 성격/말투',
  bridePersonality: '신부 성격/말투',
  secret: '비밀 에피소드',
  qnaAnswer: 'Q&A 답변',
};

const HINT_MESSAGES: Record<FieldType, string> = {
  greeting: '문구 작성이 어려우신가요?',
  closingMessage: '마무리 멘트 고민되시나요?',
  groomPersonality: '어떻게 표현해야 할지 막막하신가요?',
  bridePersonality: '어떻게 표현해야 할지 막막하신가요?',
  secret: '재밌는 에피소드가 떠오르지 않으시나요?',
  qnaAnswer: '답변 작성이 어려우신가요?',
};

export default function AiWritingAssistant({ fieldType, context, onSelect, placeholder }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'questions' | 'loading' | 'results'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [versions, setVersions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showHint, setShowHint] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowHint(prev => !prev);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/writing-assistant/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fieldType }),
      });
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (e) {
      console.error('Failed to fetch questions:', e);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setStep('questions');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setVersions([]);
    await fetchQuestions();
  };

  const handleOptionSelect = (option: string) => {
    const currentQ = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setInputValue('');
    } else {
      generateContent(newAnswers);
    }
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim() && questions[currentQuestionIndex]?.options) return;
    
    const currentQ = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQ.id]: inputValue.trim() };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setInputValue('');
    } else {
      generateContent(newAnswers);
    }
  };

  const generateContent = async (finalAnswers: Record<string, string>) => {
    setStep('loading');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/writing-assistant/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fieldType,
          context: {
            ...context,
            ...finalAnswers,
          },
        }),
      });
      const data = await res.json();
      setVersions(data.versions || []);
      setStep('results');
    } catch (e) {
      console.error('Failed to generate:', e);
      setStep('questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVersion = (version: string) => {
    onSelect(version);
    setIsOpen(false);
  };

  const handleRegenerate = () => {
    generateContent(answers);
  };

  const handleReset = () => {
    setStep('questions');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setVersions([]);
    setInputValue('');
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        <AnimatePresence mode="wait">
          {showHint && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-xs text-stone-400"
            >
              {HINT_MESSAGES[fieldType]}
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-full hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 transition-all group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </motion.span>
          <span>웨딩이에게 맡기기</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[10%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-stone-50 to-amber-50/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-800 text-sm">웨딩이 작성 도우미</h3>
                    <p className="text-xs text-stone-400">{FIELD_LABELS[fieldType]} 작성</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {step === 'questions' && currentQuestion && (
                  <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm">💬</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                          {currentQuestion.question}
                        </p>
                      </div>
                    </div>

                    {currentQuestion.options ? (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {currentQuestion.options.map((option) => (
                          <motion.button
                            key={option}
                            type="button"
                            onClick={() => handleOptionSelect(option)}
                            className="px-4 py-3 text-sm text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 hover:border-stone-300 transition-all text-left"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {option}
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="flex gap-2">
                          <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                handleInputSubmit();
                              }
                            }}
                            placeholder={placeholder || '입력해주세요...'}
                            className="flex-1 px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
                            autoFocus
                          />
                          <motion.button
                            type="button"
                            onClick={handleInputSubmit}
                            className="px-4 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.button>
                        </div>
                        <button
                          type="button"
                          onClick={handleInputSubmit}
                          className="mt-2 text-xs text-stone-400 hover:text-stone-600"
                        >
                          건너뛰기
                        </button>
                      </div>
                    )}

                    <div className="flex gap-1 justify-center mt-6">
                      {questions.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentQuestionIndex
                              ? 'bg-amber-400'
                              : idx < currentQuestionIndex
                              ? 'bg-amber-200'
                              : 'bg-stone-200'
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'loading' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 flex flex-col items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center mb-4"
                    >
                      <Sparkles className="w-5 h-5 text-white" />
                    </motion.div>
                    <p className="text-sm text-stone-600 mb-1">웨딩이가 문구를 만들고 있어요</p>
                    <p className="text-xs text-stone-400">잠시만 기다려주세요...</p>
                  </motion.div>
                )}

                {step === 'results' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">✨</span>
                      <p className="text-sm font-medium text-stone-700">이런 문구는 어떠세요?</p>
                    </div>

                    <div className="space-y-3">
                      {versions.map((version, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="group relative p-4 bg-stone-50 hover:bg-amber-50/50 rounded-xl border border-stone-200 hover:border-amber-200 transition-all cursor-pointer"
                          onClick={() => handleSelectVersion(version)}
                        >
                          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line pr-8">
                            {version}
                          </p>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ opacity: 1, scale: 1 }}
                            className="absolute top-3 right-3 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        다시 만들기
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2.5 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                      >
                        처음부터
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

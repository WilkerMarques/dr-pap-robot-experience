import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Hospital,
  MessageCircleOff,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import './styles.css';
import './tablet-16-10.css';
import {
  buildFullWhatsappDigits,
  DEFAULT_PHONE_COUNTRY,
  formatNationalPhone,
} from './phoneCountries.js';
import { LeadWhatsappField, validateLeadWhatsapp } from './LeadWhatsappField.jsx';
import { ThanksSocialFollow } from './ThanksSocialFollow.jsx';

const AVATAR_SRC = '/dr-pap-avatar.png';
const IDLE_WARN_AFTER_SECONDS = 15;
const IDLE_WARN_DURATION_SECONDS = 5;
const IDLE_RESET_SECONDS = IDLE_WARN_AFTER_SECONDS + IDLE_WARN_DURATION_SECONDS;
function shouldShowIdleWarning(screen, inactiveSeconds) {
  if (screen === screens.idle || screen === screens.thanks) {
    return false;
  }
  return inactiveSeconds >= IDLE_WARN_AFTER_SECONDS;
}
const THANKS_AUTO_RESET_SECONDS = 25;
const EMPTY_LEAD = { nome: '', hospital: '', whatsapp: '', phoneCountry: DEFAULT_PHONE_COUNTRY };

const screens = {
  idle: 'idle',
  modules: 'modules',
  profile: 'profile',
  quiz: 'quiz',
  result: 'result',
  lead: 'lead',
  thanks: 'thanks',
};

function getDevPreviewScreen() {
  if (!import.meta.env.DEV) return null;
  const screenParam = new URLSearchParams(window.location.search).get('screen');
  return Object.values(screens).includes(screenParam) ? screenParam : null;
}

const quizQuestions = [
  {
    title: 'Você acompanha indicadores hospitalares em tempo real?',
    options: [
      { label: 'Sim', score: 3 },
      { label: 'Parcialmente', score: 2 },
      { label: 'Não', score: 0 },
    ],
  },
  {
    title: 'Sua equipe consegue consultar informações do paciente de forma rápida, segura e sem depender de WhatsApp?',
    subtitle: 'Inclui comunicação interna e apoio de IA para localizar informações do paciente.',
    icon: MessageCircleOff,
    options: [
      { label: 'Sim, temos ferramenta própria', score: 3 },
      { label: 'Às vezes, mas não é padronizado', score: 1 },
      { label: 'Não, ainda dependemos do WhatsApp', score: 0 },
    ],
  },
  {
    title: 'Existe dificuldade para visualizar ocupação e produtividade?',
    icon: BarChart3,
    options: [
      { label: 'Não, visualizamos com facilidade', score: 3 },
      { label: 'Às vezes temos dificuldade', score: 1 },
      { label: 'Sim, é um desafio frequente', score: 0 },
    ],
  },
  {
    title: 'O hospital já usa IA para apoiar decisões e agilizar consultas?',
    options: [
      { label: 'Sim', score: 3 },
      { label: 'Estamos iniciando', score: 2 },
      { label: 'Ainda não', score: 0 },
    ],
  },
];

const modules = [
  { icon: Hospital, title: 'Gestão de UTI', text: 'Visão rápida de leitos, pacientes críticos e indicadores assistenciais.' },
  { icon: Stethoscope, title: 'Meu Plantão', text: 'Organização da rotina médica, enfermagem e técnico de enfermagem.' },
  { icon: ClipboardCheck, title: 'Gestão Cirúrgica', text: 'Escalas, ocupação, tempos cirúrgicos e checklists operacionais.' },
  { icon: BarChart3, title: 'Dashboard Executivo', text: 'Indicadores estratégicos para tomada de decisão da diretoria.' },
  { icon: HeartPulse, title: 'Deterioração Clínica', text: 'Apoio para identificar riscos e priorizar pacientes.' },
  { icon: MessageCircleOff, title: 'Comunicação + IA', text: 'Reduz WhatsApp, centraliza conversas e consulta dados do paciente com IA.' },
];

const profiles = [
  { title: 'Direção', text: 'Indicadores, custos, ocupação, produtividade e visão executiva em poucos cliques.' },
  { title: 'Médico', text: 'Rotina assistencial mais organizada, acesso rápido a informações e apoio à decisão.' },
  { title: 'Enfermagem', text: 'Comunicação centralizada, tarefas visíveis e menos retrabalho entre turnos.' },
  { title: 'TI', text: 'Integração com sistemas hospitalares, rastreabilidade e menos dependência de canais informais.' },
];

function App() {
  const devPreviewScreen = getDevPreviewScreen();
  const isThanksPreview = devPreviewScreen === screens.thanks;
  const [screen, setScreen] = useState(devPreviewScreen ?? screens.idle);
  const [history, setHistory] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [lead, setLead] = useState({ ...EMPTY_LEAD });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitError, setLeadSubmitError] = useState('');
  const lastInteractionRef = useRef(Date.now());
  const [idleTick, setIdleTick] = useState(0);
  const [thanksStartedAt, setThanksStartedAt] = useState(null);

  const markInteraction = () => {
    lastInteractionRef.current = Date.now();
    setIdleTick((value) => value + 1);
  };

  const markInteractionSilent = () => {
    lastInteractionRef.current = Date.now();
  };

  const go = (next) => {
    setHistory((prev) => [...prev, screen]);
    setScreen(next);
    markInteraction();
  };

  const back = () => {
    setHistory((prev) => {
      const copy = [...prev];
      const previous = copy.pop() || screens.idle;
      setScreen(previous);
      return copy;
    });
    markInteraction();
  };

  const reset = () => {
    setScreen(screens.idle);
    setHistory([]);
    setQuizIndex(0);
    setAnswers([]);
    setLead({ ...EMPTY_LEAD });
    setLeadSubmitError('');
    setLeadSubmitting(false);
    setThanksStartedAt(null);
    markInteraction();
  };

  const touch = () => markInteraction();

  useEffect(() => {
    const options = { capture: true, passive: true };
    document.addEventListener('input', markInteractionSilent, options);
    document.addEventListener('focusin', markInteractionSilent, options);
    return () => {
      document.removeEventListener('input', markInteractionSilent, options);
      document.removeEventListener('focusin', markInteractionSilent, options);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdleTick((value) => value + 1);
      if (screen === screens.idle || screen === screens.thanks) return;
      const inactiveSeconds = (Date.now() - lastInteractionRef.current) / 1000;
      if (inactiveSeconds >= IDLE_RESET_SECONDS) reset();
    }, 1000);
    return () => clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== screens.thanks) return undefined;
    setThanksStartedAt(Date.now());
    if (isThanksPreview) return undefined;
    const timer = setTimeout(reset, THANKS_AUTO_RESET_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [screen, isThanksPreview]);

  const inactiveSeconds = useMemo(() => {
    if (screen === screens.idle || screen === screens.thanks) return 0;
    return (Date.now() - lastInteractionRef.current) / 1000;
  }, [screen, idleTick]);

  const thanksSecondsLeft = useMemo(() => {
    if (!thanksStartedAt) return THANKS_AUTO_RESET_SECONDS;
    const elapsed = (Date.now() - thanksStartedAt) / 1000;
    return Math.max(0, Math.ceil(THANKS_AUTO_RESET_SECONDS - elapsed));
  }, [thanksStartedAt, idleTick]);

  const showIdleWarning = shouldShowIdleWarning(screen, inactiveSeconds);

  const score = useMemo(() => answers.reduce((acc, item) => acc + item.score, 0), [answers]);
  const maxScore = quizQuestions.length * 3;
  const percentage = Math.round((score / maxScore) * 100);

  const answerQuiz = (option) => {
    const nextAnswers = [...answers, option];
    setAnswers(nextAnswers);
    if (quizIndex + 1 >= quizQuestions.length) {
      setScreen(screens.result);
    } else {
      setQuizIndex((current) => current + 1);
    }
    markInteractionSilent();
  };

  const submitLead = async (event) => {
    event.preventDefault();
    const whatsappDigits = buildFullWhatsappDigits(lead.phoneCountry, lead.whatsapp);
    if (!whatsappDigits) return;

    setLeadSubmitting(true);
    setLeadSubmitError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: lead.nome,
          hospital: lead.hospital,
          whatsapp: whatsappDigits,
          maturidade:
            answers.length >= quizQuestions.length ? percentage : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar');
      }

      setScreen(screens.thanks);
    } catch {
      setLeadSubmitError('Não foi possível enviar. Tente novamente.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const startQuiz = () => {
    setQuizIndex(0);
    setAnswers([]);
    go(screens.quiz);
  };

  return (
    <main className="tablet-app" onPointerDown={markInteractionSilent}>
      <motion.div className="tablet-viewport">
        {showIdleWarning && (
          <SessionTimeoutOverlay
            key="idle-warning"
            lastInteractionRef={lastInteractionRef}
            onContinue={touch}
          />
        )}

        <AnimatePresence mode="wait">
          {screen === screens.idle && <Idle key="idle" onStart={startQuiz} />}
          {screen === screens.modules && <Modules key="modules" onBack={back} />}
          {screen === screens.profile && <Profile key="profile" onBack={back} />}
          {screen === screens.quiz && (
            <Quiz key="quiz" onBack={back} index={quizIndex} onAnswer={answerQuiz} />
          )}
          {screen === screens.result && <Result key="result" percentage={percentage} onBack={back} onLead={() => go(screens.lead)} />}
          {screen === screens.lead && (
            <Lead
              key="lead"
              onBack={back}
              lead={lead}
              setLead={setLead}
              submitLead={submitLead}
              submitting={leadSubmitting}
              submitError={leadSubmitError}
              onClearSubmitError={() => setLeadSubmitError('')}
            />
          )}
          {screen === screens.thanks && (
            <Thanks
              key="thanks"
              reset={reset}
              autoReturnSeconds={isThanksPreview ? null : thanksSecondsLeft}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

function SessionTimeoutOverlay({ lastInteractionRef, onContinue }) {
  const [secondsLeft, setSecondsLeft] = useState(IDLE_WARN_DURATION_SECONDS);
  const [fillPercent, setFillPercent] = useState(100);

  useEffect(() => {
    let frameId = 0;
    const update = () => {
      const inactiveSeconds = (Date.now() - lastInteractionRef.current) / 1000;
      const secondsRemaining = Math.max(0, IDLE_RESET_SECONDS - inactiveSeconds);
      const fillRatio = Math.max(
        0,
        Math.min(1, secondsRemaining / IDLE_WARN_DURATION_SECONDS),
      );
      setSecondsLeft(Math.max(0, Math.ceil(secondsRemaining)));
      setFillPercent(fillRatio * 100);
      if (secondsRemaining > 0) {
        frameId = requestAnimationFrame(update);
      }
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [lastInteractionRef]);

  return (
    <motion.div
      className="session-timeout-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label="Sessão expirando"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onContinue();
      }}
    >
      <motion.div
        className="session-timeout-card"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.25 }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <p className="session-timeout-eyebrow">Você ainda está aí?</p>
        <p className="session-timeout-count" aria-live="polite">
          {secondsLeft}
        </p>
        <p className="session-timeout-label">segundos para voltar ao início</p>
        <div
          className="session-timeout-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={IDLE_WARN_DURATION_SECONDS}
          aria-valuenow={secondsLeft}
        >
          <div
            className="session-timeout-bar-fill"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <button type="button" className="session-timeout-continue" onClick={onContinue}>
          Continuar
        </button>
      </motion.div>
    </motion.div>
  );
}

function Page({ children, className = '', onClick }) {
  const isStaticPage = className.includes('lead-page');

  if (isStaticPage) {
    return (
      <section className={`page ${className}`}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      className={`page ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.section>
  );
}

function Avatar({ size = 'header' }) {
  return (
    <div className={`avatar-wrap avatar-wrap--${size}`}>
      <img src={AVATAR_SRC} alt="Dr. PAP" className="avatar-img" draggable={false} />
    </div>
  );
}

function Header({ title, subtitle, onBack }) {
  return (
    <header className="header">
      {onBack && (
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Voltar">
          <ArrowLeft size={28} />
        </button>
      )}
      <div className="plus">+</div>
      <Avatar size="header" />
      <p className="step">{subtitle}</p>
      <h1>{title}</h1>
    </header>
  );
}

function Idle({ onStart }) {
  const handleStart = (event) => {
    event.stopPropagation();
    onStart();
  };

  return (
    <Page className="idle-page" onClick={onStart}>
      <div className="start-screen-stage">
        <div className="start-screen">
          <motion.div
            className="start-screen-body"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div className="avatar-wrapper">
              <img src={AVATAR_SRC} alt="Dr. PAP" draggable={false} />
            </motion.div>
            <div className="start-copy">
              <p className="title-small">Olá, eu sou</p>
              <h1 className="title-main">o Dr. PAP</h1>
              <p className="subtitle">
                Toque na tela para conhecer
                <br />
                nossas soluções hospitalares
              </p>
            </div>
          </motion.div>
          <button type="button" className="start-button" onClick={handleStart}>
            Começar
          </button>
        </div>
      </div>
    </Page>
  );
}

function Modules({ onBack }) {
  return (
    <Page>
      <Header title="Soluções hospitalares" subtitle="Módulos Dr. PAP" onBack={onBack} />
      <div className="cards-grid scroll-area">
        {modules.map(({ icon: Icon, title, text }) => (
          <div className="module-card" key={title}>
            <Icon size={28} />
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function Profile({ onBack }) {
  return (
    <Page>
      <Header title="Escolha seu perfil" subtitle="Simulação" onBack={onBack} />
      <div className="profile-list scroll-area">
        {profiles.map((profile) => (
          <div className="profile-card" key={profile.title}>
            <UsersRound size={28} />
            <h3>{profile.title}</h3>
            <p>{profile.text}</p>
          </div>
        ))}
      </div>
    </Page>
  );
}

function Quiz({ onBack, index, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const question = quizQuestions[index];
  const progress = ((index + 1) / quizQuestions.length) * 100;

  useEffect(() => {
    setSelected(null);
  }, [index]);

  const handleNext = () => {
    if (selected) onAnswer(selected);
  };

  return (
    <Page className="quiz-page">
      <div className="quiz-screen-stage">
        <div className="quiz-screen">
          <div className="screen-toolbar">
            <button type="button" className="screen-back quiz-back" onClick={onBack} aria-label="Voltar">
              <ArrowLeft size={32} />
            </button>
            <header className="quiz-header">
              <Avatar size="quiz" />
              <div className="quiz-header-text">
                <h1 className="quiz-heading">Diagnóstico rápido do seu hospital</h1>
              </div>
              <span className="quiz-plus" aria-hidden>+</span>
            </header>
          </div>

          <div className="quiz-body">
            <p className="quiz-progress-label">
            Pergunta {index + 1} de {quizQuestions.length}
          </p>
          <div className="quiz-progress">
            <div style={{ width: `${progress}%` }} />
          </div>

          <h2 className="quiz-question">{question.title}</h2>
          {question.subtitle && <p className="quiz-subtitle">{question.subtitle}</p>}

          <div className="quiz-answers">
            {question.options.map((option) => (
              <button
                type="button"
                key={option.label}
                className={`quiz-answer${selected?.label === option.label ? ' is-selected' : ''}`}
                onClick={() => setSelected(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
          </div>

          <button
            type="button"
            className="quiz-next"
            disabled={!selected}
            onClick={handleNext}
          >
            Próxima
          </button>
        </div>
      </div>
    </Page>
  );
}

function Result({ percentage, onBack, onLead }) {
  const message = percentage >= 70
    ? 'Seu hospital já demonstra boa maturidade digital.'
    : percentage >= 40
      ? 'Existe uma boa oportunidade para evoluir processos e comunicação.'
      : 'Seu hospital pode ganhar muito com integração, indicadores e comunicação segura.';
  return (
    <Page className="result-page">
      <motion.div
        className="result-screen-stage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28 }}
      >
        <div className="result-screen">
          <div className="screen-toolbar screen-toolbar--compact">
            <button type="button" className="screen-back result-back" onClick={onBack} aria-label="Voltar">
              <ArrowLeft size={32} />
            </button>
          </div>

          <motion.div className="result-main">
            <motion.div
              className="result-hero"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 }}
            >
              <motion.div
                className="result-hero-icon"
                aria-hidden
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.12 }}
              >
                <Sparkles size={36} />
              </motion.div>
              <p className="result-label">Resultado</p>
              <p className="result-score" aria-live="polite">{percentage}%</p>
              <h1 className="result-heading">Maturidade digital</h1>
              <p className="result-message">{message}</p>
            </motion.div>

            <motion.div
              className="result-insight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
            >
              <ShieldCheck size={32} aria-hidden />
              <p>
                Com comunicação centralizada e IA, sua equipe reduz WhatsApp, melhora
                rastreabilidade e consulta informações do paciente com mais agilidade.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            className="result-cta-wrap"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.26 }}
          >
            <button type="button" className="result-cta" onClick={onLead}>
              Receber demonstração
            </button>
          </motion.div>
        </div>
      </motion.div>
    </Page>
  );
}

function Lead({
  onBack,
  lead,
  setLead,
  submitLead,
  submitting,
  submitError,
  onClearSubmitError,
}) {
  const [whatsappError, setWhatsappError] = useState(false);
  const update = (field) => (event) => {
    onClearSubmitError();
    const raw = event.target.value;
    setLead((prev) => ({ ...prev, [field]: raw.toUpperCase() }));
  };

  const handleCountryChange = (iso) => {
    setLead((prev) => ({
      ...prev,
      phoneCountry: iso,
      whatsapp: formatNationalPhone(iso, prev.whatsapp),
    }));
  };

  const handleSubmit = (event) => {
    if (!validateLeadWhatsapp(lead.phoneCountry, lead.whatsapp)) {
      event.preventDefault();
      setWhatsappError(true);
      return;
    }
    setWhatsappError(false);
    submitLead(event);
  };

  return (
    <Page className="lead-page">
      <div className="lead-screen-stage">
        <div className="lead-screen">
          <div className="screen-toolbar screen-toolbar--lead">
            <button type="button" className="screen-back lead-back" onClick={onBack} aria-label="Voltar">
              <ArrowLeft size={32} />
            </button>
            <header className="lead-header">
              <h1 className="lead-title">Receba uma demonstração</h1>
              <p className="lead-subtitle">
                Preencha seus dados para agendarmos uma conversa personalizada.
              </p>
            </header>
          </div>

          <form
            className="lead-form"
            onSubmit={handleSubmit}
            noValidate
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <label className="lead-field">
              <span className="lead-label">Nome</span>
              <input
                type="text"
                name="nome"
                autoComplete="name"
                placeholder="SEU NOME COMPLETO"
                value={lead.nome}
                onChange={update('nome')}
                required
              />
            </label>

            <label className="lead-field">
              <span className="lead-label">Hospital / Empresa</span>
              <input
                type="text"
                name="hospital"
                autoComplete="organization"
                placeholder="NOME DO HOSPITAL OU EMPRESA"
                value={lead.hospital}
                onChange={update('hospital')}
                required
              />
            </label>

            <div className={`lead-field${whatsappError ? ' lead-field--error' : ''}`}>
              <span className="lead-label" id="lead-whatsapp-label">
                WhatsApp
              </span>
              <LeadWhatsappField
                phoneCountry={lead.phoneCountry}
                whatsapp={lead.whatsapp}
                hasError={whatsappError}
                onCountryChange={handleCountryChange}
                onWhatsappChange={(value) => setLead((prev) => ({ ...prev, whatsapp: value }))}
                onClearError={() => {
                  setWhatsappError(false);
                  onClearSubmitError();
                }}
              />
            </div>

            {submitError && (
              <p className="lead-submit-error" role="alert">
                {submitError}
              </p>
            )}

            <button type="submit" className="lead-submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Quero uma demonstração'}
              {!submitting && <Send size={28} aria-hidden />}
            </button>
          </form>

          <p className="lead-safe-note">
            <ShieldCheck size={24} aria-hidden />
            Nossa equipe entrará em contato
          </p>
        </div>
      </div>
    </Page>
  );
}

function Thanks({ reset, autoReturnSeconds }) {
  return (
    <Page className="thanks-page">
      <motion.div
        className="thanks-screen-stage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28 }}
      >
        <motion.div className="thanks-screen">
          <motion.div
            className="thanks-body"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <div className="thanks-confirm">
              <motion.div
                className="thanks-icon"
                aria-hidden
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.12 }}
              >
                <CheckCircle2 strokeWidth={2.25} />
              </motion.div>
              <h1 className="thanks-title">Obrigado!</h1>
              <p className="thanks-message">
                Seu contato foi registrado. Em breve nossa equipe entra em contato para a demonstração.
              </p>
              {autoReturnSeconds != null && (
                <p className="thanks-auto-return">
                  Voltando ao início em {autoReturnSeconds}s
                </p>
              )}
            </div>

            <ThanksSocialFollow />
          </motion.div>

          <motion.button
            type="button"
            className="thanks-reset"
            onClick={reset}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            whileTap={{ scale: 0.99 }}
          >
            Voltar ao início
          </motion.button>
        </motion.div>
      </motion.div>
    </Page>
  );
}

createRoot(document.getElementById('root')).render(<App />);

export const projectData = {
  sivo: {
    title: "SIVO",
    subtitle: "Sign to speech & speech to sign",
    description:
      "For my Final Year Project, I built an app called SIVO. Basically, I wanted to solve a real, everyday problem: the communication gap between the deaf community and hearing people. Instead of relying on a human interpreter, I built a two-way translator that fits right in your pocket. Here is how it works: you point your phone's camera at someone using Pakistan Sign Language (PSL). The app tracks their hand and body movements, figures out what they are signing, and instantly speaks the words out loud. It also works in reverse: you can talk into the phone, and the app will translate your voice into sign language on the screen.",
    tech: {
      backend: "Python, Flask, TensorFlow",
      frontend: "React-Native",
    },
    github: "https://github.com/Abubakarproductdev/Final-Year-Project",
    hardestPath:
      "Getting a heavy AI model to run in real-time on a mobile phone was honestly the hardest part. I built the mobile app using React Native, but I offloaded all the heavy AI processing, using tools like TensorFlow, MediaPipe, and OpenCV, to a custom Python cloud server.",
    challenges:
      "If I'm being honest, getting an AI to recognize a single, isolated sign, like 'Hello', is actually pretty straightforward. You show the model the gesture, it memorizes the hand landmarks, and you're good to go. But real life isn't a flashcard app. In the real world, people sign continuously and fluidly. When a user transitions from signing the word 'Boss' to the word 'Send,' their hands move through the air in a very unpredictable way. To a trained AI, that blurry, halfway-there hand movement looks like a completely different, random word. Instead of predicting properly, my model was initially spitting out absolute gibberish like 'Boss... Make... Apple... Send.' The noise between the signs was ruining the entire sentence.",
    MySolutions: `I spent weeks banging my head against the wall trying to fix this. I dug through dozens of academic research papers on sign language recognition, and I spent hours prompting every AI tool I could find, begging for a solution.

But almost everything I found was either too theoretical or just flat-out didn't work for a real-time mobile app.

What the AI suggested:
The AI models usually gave me standard, math-heavy computer science answers. The most common suggestion was to calculate hand speed. The logic was: if the hands slow down or stop, the person is making a sign; if the hands are moving super fast, they are just transitioning between words, so the app should ignore those frames.

Why it failed in my case: every person signs at a different speed. Some people sign incredibly fast and fluidly, while others take their time. The velocity thresholds were way too fragile.

What academic papers suggested:
A lot of researchers solved this by introducing a null or neutral sign. They trained their AI to recognize when a person's hands were resting at their sides, and forced the user to drop their hands back to a resting position between every word.

Why it failed in my case: it technically worked, but it destroyed the natural flow of Pakistan Sign Language.

Engineering my own solution:
I built a customized sliding window approach. Instead of looking at a single moment in time, I built a dynamic buffer that captures overlapping 30-frame blocks of video. The model evaluates the contextual flow of the entire movement, filtering out the transition noise naturally.

I also engineered a server-side smart matcher. If the sliding window caught messy keywords like "Boss... send... word," the server cross-references it against a database of valid, grammatically correct sentences and outputs: "Boss send project report."

By ignoring the standard hand-speed and null-sign advice and building a custom AI pipeline, I achieved a system that understands the user's intent, reaching a 95% accuracy rate without asking them to slow down.`,
    hasDemo: true,
  },
  agrimind: {
    title: "Agrimind",
    subtitle: "AI farmers resource allocation",
    description:
      "Agrimind revolutionizes modern agriculture by bringing intelligent resource allocation to the fingertips of farmers. Using an ecosystem of specialized AI agents powered by Langgraph, it predicts crop yields, optimizes water usage, and provides real-time market insights. The backend architecture seamlessly connects Python AI modeling with a robust Node.js and MongoDB foundation, while next-generation web technologies deliver actionable insights.",
    tech: {
      backend: "Python (AI agents), Langgraph, Node.js, MongoDB",
      frontend: "Next.js, Tailwind",
    },
    github: "https://github.com/Abubakarproductdev/Agrimind--AI-farmers-resource-allocator",
    hardestPath:
      "Orchestrating multiple specialized AI agents without them getting stuck in infinite reasoning loops or losing context.",
    challenges:
      "The main challenge was managing the state between the Python Langgraph agents and the Node.js backend. Passing complex agricultural data seamlessly while keeping response times low was difficult.",
    MySolutions:
      "I designed a strict state-graph protocol in Langgraph to cap reasoning steps. I also built a unified API layer in Node.js to parse the agent outputs cleanly before delivering them to the Next.js frontend.",
  },
  quant: {
    title: "Semi-Quant Auto",
    subtitle: "Future market strategy automation",
    description:
      "A high-performance algorithmic trading system engineered for future markets. Semi-Quant Auto minimizes human error and emotion by automating complex quantitative strategies. Developed purely in Python, the pipeline manages massive streams of market data, executes split-second decisions, and visualizes live performance through dynamic charting dashboards.",
    tech: { backend: "Python", frontend: "Python" },
    github: "https://github.com",
    hardestPath:
      "Ensuring near-zero latency data processing and avoiding exchange API rate limits during high market volatility.",
    challenges:
      "Handling continuous, massive streams of tick data caused memory leaks in early versions. Additionally, rendering real-time charts blocked the main execution thread.",
    MySolutions:
      "I rewrote the data ingestion pipeline using Python's asyncio for concurrent processing. I also decoupled the trading logic from the UI charting, running them on separate processes to ensure executions never lagged.",
  },
  startup: {
    title: "Startup Analyser",
    subtitle: "AI startup analyser using RAG system",
    description:
      "Startup Analyser provides deep, actionable intelligence on emerging companies by leveraging a sophisticated Retrieval-Augmented Generation (RAG) system. Investors and analysts can explore massive datasets of startup metrics, pitch decks, and market positioning. The system combines Redis caching and MongoDB for extreme speed, presented via a sleek React interface.",
    tech: {
      backend: "Python, Node.js, Express, MongoDB, Redis",
      frontend: "React.js",
    },
    github: "https://github.com/Abubakarproductdev/Start-Up-Analysis--LIVE-WEB-SEARCH-RAG",
    hardestPath:
      "Achieving accurate context retrieval from highly unstructured data like pitch decks and complex financial metrics.",
    challenges:
      "Standard RAG approaches kept returning irrelevant chunks of text. Furthermore, querying the vector database simultaneously with MongoDB caused high latency on the frontend.",
    MySolutions:
      "I tuned the RAG embedding strategy to prioritize financial semantics and structural context. To solve the speed issue, I implemented Redis to cache frequent queries, slashing load times for the React UI.",
  },
  armall: {
    title: "ArMall.pk",
    subtitle: "Ecommerce website design",
    description:
      "ArMall is a premium e-commerce platform redefining digital retail with speed, absolute security, and immersive design. The architecture is built on Next.js for lightning-fast server-side rendering, secured by Clerk authentication routines, and scaled globally with MongoDB and Mongoose. The frontend provides a buttery-smooth shopping experience accented by high-contrast brutalist aesthetics.",
    tech: {
      backend: "Next.js, Mongoose, Clerk, MongoDB",
      frontend: "Next.js, Tailwind",
    },
    github: "https://github.com/Abubakarproductdev/AR-Mall-E-commerce-",
    hardestPath:
      "Maintaining strict data consistency between the Clerk authentication system and our custom MongoDB user records.",
    challenges:
      "Managing complex shopping cart states during Next.js Server-Side Rendering (SSR) without breaking the fluid UI animations or causing hydration errors.",
    MySolutions:
      "I utilized Clerk webhooks to instantly sync user data events into the Mongoose schemas. I also optimized Next.js server actions to handle cart mutations in the background, keeping the Tailwind interface snappy.",
  },
};

export const projectCards = [
  {
    slug: "sivo",
    image: "/sivo.webp",
    title: "SIVO",
    subtitle: "Sign to speech & speech to sign",
    backend: "Python, Flask, TensorFlow",
    frontend: "React-Native",
  },
  {
    slug: "agrimind",
    image: "/agri.webp",
    title: "Agrimind",
    subtitle: "AI farmers resource allocation",
    backend: "Python (AI agents), Langgraph, Node.js, MongoDB",
    frontend: "Next.js, Tailwind",
  },
  {
    slug: "quant",
    image: "/stra.webp",
    title: "Semi-Quant Auto",
    subtitle: "Future market strategy Automation",
    backend: "Python",
    frontend: "Python",
  },
  {
    slug: "startup",
    image: "/startup.webp",
    title: "Startup Analyser",
    subtitle: "AI startup analyser using RAG system",
    backend: "Python, Node.js, Express, MongoDB, Redis",
    frontend: "React.js",
  },
  {
    slug: "armall",
    image: "/e.webp",
    title: "ArMall.pk",
    subtitle: "Ecommerce website design",
    backend: "Next.js, Mongoose, Clerk, MongoDB",
    frontend: "Next.js, Tailwind",
  },
];

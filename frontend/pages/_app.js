import Head from 'next/head';

export default function App({ Component, pageProps }) {
    return (
        <>
            <Head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>
            <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
          background: #F8FAFC;
          color: #1F2937;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        a {
          text-decoration: none;
          color: inherit;
        }

        button {
          font-family: 'Inter', sans-serif;
        }

        input, textarea, select {
          font-family: 'Inter', sans-serif;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
            <Component {...pageProps} />
        </>
    );
}

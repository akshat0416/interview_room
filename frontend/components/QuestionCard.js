export default function QuestionCard({ question, index, onThumbsUp, onFlag }) {
    const getCategoryColor = (category) => {
        const colors = {
            'Technical': { bg: '#E0F2FE', text: '#0284C7', border: '#7DD3FC' },
            'Leadership': { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
            'Soft Skills': { bg: '#FFF7ED', text: '#EA580C', border: '#FDBA74' },
            'System Design': { bg: '#E0F2FE', text: '#0284C7', border: '#7DD3FC' },
            'Best Practices': { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
            'Problem Solving': { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
        };
        return colors[category] || { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            'Hard': { bg: '#FEE2E2', text: '#DC2626' },
            'Medium': { bg: '#FEF3C7', text: '#D97706' },
            'Easy': { bg: '#ECFDF5', text: '#059669' },
        };
        return colors[difficulty] || { bg: '#F3F4F6', text: '#6B7280' };
    };

    const catColor = getCategoryColor(question.category);
    const diffColor = getDifficultyColor(question.difficulty);

    return (
        <div className="question-card">
            <div className="question-header">
                <div className="badges">
                    <span className="badge category-badge" style={{
                        background: catColor.bg,
                        color: catColor.text,
                        border: `1px solid ${catColor.border}`,
                    }}>
                        {question.category}
                    </span>
                    {question.difficulty && (
                        <span className="badge difficulty-badge" style={{
                            background: diffColor.bg,
                            color: diffColor.text,
                        }}>
                            {question.difficulty}
                        </span>
                    )}
                </div>
                <div className="question-actions">
                    <button className="action-btn" onClick={() => onThumbsUp && onThumbsUp(question.id)} title="Thumbs up">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                    </button>
                    <button className="action-btn" onClick={() => onFlag && onFlag(question.id)} title="Flag">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                    </button>
                </div>
            </div>
            <p className="question-text">{question.text}</p>
            {question.asked_at && (
                <span className="question-time">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Asked at {question.asked_at}
                </span>
            )}

            <style jsx>{`
        .question-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          transition: box-shadow 0.2s;
        }
        .question-card:hover {
          box-shadow: 0 4px 12px rgba(0, 163, 224, 0.1);
        }
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
        }
        .question-actions {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: #9CA3AF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .action-btn:hover {
          color: #00A3E0;
          background: #F0F9FF;
        }
        .question-text {
          font-size: 15px;
          color: #1F2937;
          line-height: 1.5;
          margin: 0 0 8px 0;
          font-family: 'Inter', sans-serif;
        }
        .question-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #9CA3AF;
          font-family: 'Inter', sans-serif;
        }
      `}</style>
        </div>
    );
}

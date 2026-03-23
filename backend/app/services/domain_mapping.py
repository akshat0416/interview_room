"""
Domain mapping - Maps job domains to question categories.
"""

DOMAIN_QUESTION_MAP = {
    "Full Stack": {
        "categories": ["Technical", "System Design", "Problem Solving"],
        "sample_questions": [
            {"category": "Technical", "difficulty": "Hard", "text": "Explain your approach to microservices architecture."},
            {"category": "System Design", "difficulty": "Hard", "text": "Design a real-time notification system at scale."},
            {"category": "Problem Solving", "difficulty": "Medium", "text": "How would you debug a memory leak in production?"},
            {"category": "Technical", "difficulty": "Medium", "text": "Compare REST and GraphQL for a data-heavy application."},
            {"category": "Best Practices", "difficulty": "Medium", "text": "How do you ensure code quality in your projects?"},
            {"category": "Soft Skills", "difficulty": "Easy", "text": "How do you handle conflicts in a team?"},
        ],
    },
    "DevOps": {
        "categories": ["Technical", "System Design", "Best Practices"],
        "sample_questions": [
            {"category": "Technical", "difficulty": "Hard", "text": "Explain your CI/CD pipeline design."},
            {"category": "System Design", "difficulty": "Hard", "text": "Design a multi-region deployment strategy."},
            {"category": "Best Practices", "difficulty": "Medium", "text": "How do you approach infrastructure as code?"},
            {"category": "Technical", "difficulty": "Medium", "text": "Tell me about your experience with container orchestration."},
            {"category": "Leadership", "difficulty": "Medium", "text": "Describe a time you led a cloud migration project."},
            {"category": "Soft Skills", "difficulty": "Easy", "text": "How do you communicate complex technical issues to non-technical stakeholders?"},
        ],
    },
    "Product Management": {
        "categories": ["Leadership", "Soft Skills", "Problem Solving"],
        "sample_questions": [
            {"category": "Leadership", "difficulty": "Hard", "text": "How do you prioritize features across multiple stakeholders?"},
            {"category": "Problem Solving", "difficulty": "Medium", "text": "How do you measure the success of a product launch?"},
            {"category": "Soft Skills", "difficulty": "Medium", "text": "How do you handle disagreements between engineering and design teams?"},
            {"category": "Leadership", "difficulty": "Hard", "text": "Describe your approach to creating a product roadmap."},
            {"category": "Soft Skills", "difficulty": "Easy", "text": "How do you gather user feedback effectively?"},
        ],
    },
    "Design": {
        "categories": ["Technical", "Soft Skills", "Problem Solving"],
        "sample_questions": [
            {"category": "Technical", "difficulty": "Hard", "text": "Explain your approach to design systems and component libraries."},
            {"category": "Problem Solving", "difficulty": "Medium", "text": "How do you conduct usability testing?"},
            {"category": "Soft Skills", "difficulty": "Medium", "text": "How do you handle feedback on your designs?"},
            {"category": "Technical", "difficulty": "Medium", "text": "Describe your process for creating accessible interfaces."},
        ],
    },
}


def get_questions_for_domain(domain: str) -> list:
    """Get sample questions for a given domain."""
    for key, value in DOMAIN_QUESTION_MAP.items():
        if key.lower() in domain.lower():
            return value["sample_questions"]
    # Default to Full Stack if no match
    return DOMAIN_QUESTION_MAP["Full Stack"]["sample_questions"]


def get_categories_for_domain(domain: str) -> list:
    """Get question categories for a given domain."""
    for key, value in DOMAIN_QUESTION_MAP.items():
        if key.lower() in domain.lower():
            return value["categories"]
    return ["Technical", "Leadership", "Soft Skills"]

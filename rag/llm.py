from openai import OpenAI


class LLMClient:
    def __init__(self, model: str) -> None:
        """Create a small wrapper around the OpenAI chat client."""
        self.model = model
        self.client = OpenAI()

    def complete(self, system: str, user: str, temperature: float = 0.2) -> str:
        """Send one chat completion request and return the text content."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
        )
        return response.choices[0].message.content.strip()

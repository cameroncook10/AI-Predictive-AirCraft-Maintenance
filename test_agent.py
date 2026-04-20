import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# Initialize the new google-genai client
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_INSTRUCTION = (
    "You are an expert AI aircraft maintenance assistant. "
    "You help technicians interpret inspection results, understand defect types "
    "(dents, cracks, corrosion, paint damage), and advise on maintenance procedures. "
    "Be concise, precise, and safety-focused."
)

# Maintain chat history manually
history = []

print("✈️  Aircraft Maintenance AI Agent Ready. Type 'quit' to exit.\n")

while True:
    user_input = input("You: ")
    if user_input.lower() in ["quit", "exit"]:
        break

    # Append user message to history
    history.append(types.Content(role="user", parts=[types.Part(text=user_input)]))

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=history,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION),
    )

    reply = response.text
    # Append model reply to history to maintain context
    history.append(types.Content(role="model", parts=[types.Part(text=reply)]))

    print(f"\nAgent: {reply}\n")

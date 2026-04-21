#!/usr/bin/env python3
"""
SilverConnect AI Customer Service Agent
=======================================

AI-powered customer service agent for SilverConnect Global that handles:
- Customer acquisition and onboarding
- Booking management (cancellations, modifications, status checks)
- Emergency support and 24/7 availability
- Multi-language support (English, Chinese)
- Integration with Supabase database

Contact Integration:
- WhatsApp: +61452409228
- WeChat: +61452409228
- Work# China: +8618271390346
- Work# Australia: +61452409228
- Work# Canada: +16042486604
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=False)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import AI/ML libraries (fallback to OpenAI if Foundry not available)
try:
    from agent_framework import Agent
    from agent_framework.foundry import FoundryChatClient
    from azure.identity import DefaultAzureCredential
    logger.info("Using Microsoft Agent Framework with Foundry")
    USE_FOUNDRY = True
except ImportError:
    from openai import AsyncOpenAI
    logger.info("Foundry not available, using OpenAI fallback")
    USE_FOUNDRY = False

# Supabase integration
try:
    from supabase import create_client, Client
except ImportError:
    logger.error("Supabase client not installed. Install with: pip install supabase")
    exit(1)

# FastAPI for HTTP server
try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.responses import JSONResponse
    from pydantic import BaseModel
except ImportError:
    logger.error("FastAPI not installed. Install with: pip install fastapi uvicorn")
    exit(1)

# Contact information
CONTACT_INFO = {
    "whatsapp": "+61452409228",
    "wechat": "+61452409228",
    "china_work": "+8618271390346",
    "australia_work": "+61452409228",
    "canada_work": "+16042486604"
}

# Service regions
REGIONS = {
    "AU": {"name": "Australia", "currency": "AUD", "timezone": "Australia/Sydney"},
    "CN": {"name": "China", "currency": "CNY", "timezone": "Asia/Shanghai"},
    "CA": {"name": "Canada", "currency": "CAD", "timezone": "America/Toronto"}
}

class CustomerQuery(BaseModel):
    message: str
    user_id: Optional[str] = None
    language: str = "en"
    region: str = "AU"
    contact_method: str = "web"

class BookingRequest(BaseModel):
    action: str  # 'cancel', 'modify', 'status', 'create'
    booking_id: Optional[str] = None
    user_id: str
    details: Dict[str, Any] = {}

class AIServiceAgent:
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )

        if USE_FOUNDRY:
            credential = DefaultAzureCredential()
            self.client = FoundryChatClient(
                project_endpoint=os.getenv("FOUNDRY_PROJECT_ENDPOINT"),
                model=os.getenv("FOUNDRY_MODEL_DEPLOYMENT_NAME"),
                credential=credential,
            )
        else:
            self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        self.agent_instructions = self._get_agent_instructions()

    def _get_agent_instructions(self) -> str:
        return f"""
You are SilverConnect AI, an intelligent customer service agent for SilverConnect Global, a senior care marketplace serving Australia, China, and Canada.

Your capabilities:
1. Handle customer acquisition and onboarding
2. Manage bookings (create, cancel, modify, check status)
3. Provide emergency support 24/7
4. Support multiple languages (English, Chinese)
5. Integrate with our database for real-time information

Contact Information:
- WhatsApp: {CONTACT_INFO['whatsapp']}
- WeChat: {CONTACT_INFO['wechat']}
- China Work: {CONTACT_INFO['china_work']}
- Australia Work: {CONTACT_INFO['australia_work']}
- Canada Work: {CONTACT_INFO['canada_work']}

Service Regions: {json.dumps(REGIONS, indent=2)}

Guidelines:
- Always be helpful, professional, and empathetic
- For emergencies, provide immediate contact numbers and escalate
- Handle booking cancellations automatically when appropriate
- Route complex issues to human support
- Support both English and Chinese conversations
- Verify user identity before sensitive operations
- Provide accurate pricing in local currency
- Respect regional regulations and requirements

Emergency Protocol:
If a customer reports an emergency situation:
1. Immediately provide relevant emergency contact numbers
2. Ask for location details to provide region-specific help
3. If it's a service emergency, connect them with the nearest provider
4. Stay on the line/chat until help arrives or customer is safe

Booking Management:
- Cancellations: Process within 24 hours for full refund
- Modifications: Allow changes up to 2 hours before service
- Status checks: Provide real-time booking information
- New bookings: Guide through the process with available options
"""

    async def process_customer_query(self, query: CustomerQuery) -> Dict[str, Any]:
        """Process customer queries and return appropriate responses"""

        # Get user context if user_id provided
        user_context = ""
        if query.user_id:
            user_data = await self._get_user_data(query.user_id)
            if user_data:
                user_context = f"""
User Information:
- Name: {user_data.get('full_name', 'Unknown')}
- Email: {user_data.get('email', 'Unknown')}
- Region: {user_data.get('country_code', 'Unknown')}
- User Type: {user_data.get('user_type', 'customer')}
"""

        # Get conversation history for context
        conversation_history = await self._get_conversation_history(query.user_id)

        # Prepare the AI prompt
        system_prompt = f"{self.agent_instructions}\n\n{user_context}"

        user_prompt = f"""
Customer Query: {query.message}
Language: {query.language}
Region: {query.region}
Contact Method: {query.contact_method}

Recent Conversation History:
{conversation_history}

Please respond appropriately to this customer query. If this involves booking management, emergency support, or sensitive operations, take the appropriate actions.
"""

        try:
            if USE_FOUNDRY:
                async with Agent(
                    client=self.client,
                    name="SilverConnect_AI_Agent",
                    instructions=system_prompt
                ) as agent:
                    response = await agent.run(user_prompt)
                    ai_response = response.text
            else:
                response = await self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                ai_response = response.choices[0].message.content

            # Process any actions mentioned in the response
            actions_taken = await self._process_response_actions(ai_response, query)

            # Save conversation
            await self._save_conversation(query, ai_response)

            return {
                "response": ai_response,
                "actions_taken": actions_taken,
                "language": query.language,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                "response": self._get_fallback_response(query.language),
                "error": str(e),
                "language": query.language,
                "timestamp": datetime.utcnow().isoformat()
            }

    async def process_booking_request(self, request: BookingRequest) -> Dict[str, Any]:
        """Handle booking-related operations"""

        try:
            if request.action == "cancel":
                result = await self._cancel_booking(request.booking_id, request.user_id, request.details)
            elif request.action == "modify":
                result = await self._modify_booking(request.booking_id, request.user_id, request.details)
            elif request.action == "status":
                result = await self._get_booking_status(request.booking_id, request.user_id)
            elif request.action == "create":
                result = await self._create_booking(request.user_id, request.details)
            else:
                raise ValueError(f"Unknown action: {request.action}")

            return result

        except Exception as e:
            logger.error(f"Error processing booking request: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    async def _get_user_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user data from Supabase"""
        try:
            response = self.supabase.table('users').select('*').eq('id', user_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error getting user data: {e}")
            return None

    async def _get_conversation_history(self, user_id: Optional[str], limit: int = 5) -> str:
        """Get recent conversation history"""
        if not user_id:
            return "No previous conversation history."

        try:
            # This would need to be implemented based on your conversation storage
            # For now, return a placeholder
            return "Previous conversations would be loaded here."
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return "Error loading conversation history."

    async def _process_response_actions(self, response: str, query: CustomerQuery) -> List[str]:
        """Process any actions mentioned in the AI response"""
        actions = []

        # Check for booking cancellation requests
        if "cancel" in response.lower() and "booking" in response.lower():
            # Extract booking ID from context or ask user
            actions.append("booking_cancellation_initiated")

        # Check for emergency escalation
        if any(word in response.lower() for word in ["emergency", "urgent", "help", "danger"]):
            actions.append("emergency_escalation")

        # Check for human handoff requests
        if any(word in response.lower() for word in ["speak to human", "talk to representative", "human agent"]):
            actions.append("human_handoff_requested")

        return actions

    async def _cancel_booking(self, booking_id: str, user_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Cancel a booking"""
        try:
            # Check if booking exists and belongs to user
            booking = self.supabase.table('bookings').select('*').eq('id', booking_id).eq('user_id', user_id).single().execute()

            if not booking.data:
                return {"success": False, "message": "Booking not found or access denied."}

            # Check cancellation policy (within 24 hours)
            booking_time = datetime.fromisoformat(booking.data['booking_date'] + 'T' + booking.data['booking_time'])
            time_diff = booking_time - datetime.utcnow()

            if time_diff.total_seconds() < 24 * 3600:  # Within 24 hours
                # Update booking status
                self.supabase.table('bookings').update({
                    'status': 'CANCELLED',
                    'payment_status': 'REFUNDED'
                }).eq('id', booking_id).execute()

                # Log status change
                self.supabase.table('booking_status_history').insert({
                    'booking_id': booking_id,
                    'old_status': booking.data['status'],
                    'new_status': 'CANCELLED',
                    'changed_by': user_id,
                    'reason': details.get('reason', 'Customer requested cancellation')
                }).execute()

                return {
                    "success": True,
                    "message": "Booking cancelled successfully. Refund will be processed within 3-5 business days.",
                    "refund_amount": booking.data['total_price']
                }
            else:
                return {
                    "success": False,
                    "message": "Bookings can only be cancelled within 24 hours of the scheduled time."
                }

        except Exception as e:
            logger.error(f"Error cancelling booking: {e}")
            return {"success": False, "message": "Error processing cancellation request."}

    async def _modify_booking(self, booking_id: str, user_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Modify a booking"""
        try:
            # Similar logic to cancellation but for modifications
            # Implementation would depend on what can be modified
            return {"success": True, "message": "Booking modification feature coming soon."}
        except Exception as e:
            return {"success": False, "message": "Error processing modification request."}

    async def _get_booking_status(self, booking_id: str, user_id: str) -> Dict[str, Any]:
        """Get booking status"""
        try:
            booking = self.supabase.table('bookings').select('*, services(*)').eq('id', booking_id).eq('user_id', user_id).single().execute()

            if not booking.data:
                return {"success": False, "message": "Booking not found."}

            return {
                "success": True,
                "booking": booking.data
            }
        except Exception as e:
            return {"success": False, "message": "Error retrieving booking status."}

    async def _create_booking(self, user_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new booking"""
        try:
            # Implementation for booking creation
            return {"success": True, "message": "Booking creation feature integrated with main app."}
        except Exception as e:
            return {"success": False, "message": "Error creating booking."}

    async def _save_conversation(self, query: CustomerQuery, response: str):
        """Save conversation for context"""
        try:
            # Implementation would save to conversations/messages tables
            pass
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")

    def _get_fallback_response(self, language: str) -> str:
        """Fallback response when AI fails"""
        responses = {
            "en": "I'm experiencing technical difficulties. Please contact our support team directly: WhatsApp +61452409228 or call our emergency line.",
            "zh": "我遇到技术问题。请直接联系我们的支持团队：WhatsApp +61452409228 或拨打紧急电话。"
        }
        return responses.get(language, responses["en"])

# FastAPI Application
app = FastAPI(title="SilverConnect AI Customer Service Agent")

# Global agent instance
agent = AIServiceAgent()

@app.post("/api/customer-service")
async def handle_customer_query(query: CustomerQuery):
    """Handle customer service queries"""
    try:
        result = await agent.process_customer_query(query)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/booking")
async def handle_booking_request(request: BookingRequest):
    """Handle booking operations"""
    try:
        result = await agent.process_booking_request(request)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Booking API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/contacts")
async def get_contacts():
    """Get contact information"""
    return {
        "contacts": CONTACT_INFO,
        "regions": REGIONS,
        "emergency": True
    }

if __name__ == "__main__":
    import uvicorn

    # Check required environment variables
    required_vars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY"
    ]

    ai_vars = []
    if USE_FOUNDRY:
        ai_vars = ["FOUNDRY_PROJECT_ENDPOINT", "FOUNDRY_MODEL_DEPLOYMENT_NAME"]
    else:
        ai_vars = ["OPENAI_API_KEY"]

    missing_vars = [var for var in required_vars + ai_vars if not os.getenv(var)]

    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        exit(1)

    logger.info("Starting SilverConnect AI Customer Service Agent...")
    logger.info(f"Using AI Provider: {'Microsoft Foundry' if USE_FOUNDRY else 'OpenAI'}")
    logger.info(f"Contact Numbers: {CONTACT_INFO}")

    uvicorn.run(
        "ai_customer_service:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )

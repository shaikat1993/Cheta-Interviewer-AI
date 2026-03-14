import asyncio
from services.jd_service import analyze_jd

async def main():
    try:
        res = await analyze_jd('developing scalable Java backend working with AI powered features')
        print('SUCCESS:', res)
    except Exception as e:
        print('EXCEPTION:', repr(e))

asyncio.run(main())

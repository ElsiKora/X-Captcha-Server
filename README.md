<p align="center">
  <img src="https://6jft62zmy9nx2oea.public.blob.vercel-storage.com/x-captcha-server-TIlSKO71oNmsePUw1d7dEXOaQqTBR9.png" width="500" alt="project-logo">
</p>

<h1 align="center">🛡️ X-Captcha-Server</h1>
<p align="center"><em>A robust server implementation for CAPTCHA challenges to protect your applications from bots</em></p>

<p align="center">
    <a aria-label="ElsiKora logo" href="https://elsikora.com">
  <img src="https://img.shields.io/badge/MADE%20BY%20ElsiKora-333333.svg?style=for-the-badge" alt="ElsiKora">
</a> <img src="https://img.shields.io/badge/TypeScript-blue.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"> <img src="https://img.shields.io/badge/NestJS-red.svg?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"> <img src="https://img.shields.io/badge/Swagger-green.svg?style=for-the-badge&logo=swagger&logoColor=white" alt="Swagger"> <img src="https://img.shields.io/badge/PostgreSQL-blue.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"> <img src="https://img.shields.io/badge/Docker-blue.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"> <img src="https://img.shields.io/badge/AWS-orange.svg?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS"> <img src="https://img.shields.io/badge/License-green.svg?style=for-the-badge&logo=license&logoColor=white" alt="License">
</p>


## 📚 Table of Contents
- [Description](#-description)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Roadmap](#-roadmap)
- [FAQ](#-faq)
- [License](#-license)


## 📖 Description
X-Captcha-Server is a comprehensive NestJS-based backend service that provides modern CAPTCHA protection capabilities for web applications. It implements multiple challenge types including Proof-of-Work (PoW) and click-based challenges to effectively distinguish between human users and automated bots. Built with security and performance in mind, this service can be easily integrated into your application infrastructure to protect forms, sign-up processes, and sensitive actions from abuse. X-Captcha-Server handles the creation, verification, and management of CAPTCHA challenges while providing a clean API for your frontend to interact with.

## 🚀 Features
- ✨ **Multiple CAPTCHA challenge types (Proof-of-Work and Click-based mechanisms)**
- ✨ **Secure client authentication via public/secret key pairs**
- ✨ **Comprehensive API with Swagger documentation**
- ✨ **Database persistence for challenges and verification**
- ✨ **Advanced logging with AWS CloudWatch integration**
- ✨ **Error tracking with Sentry integration**
- ✨ **Configurable via AWS Parameter Store**
- ✨ **Event-driven architecture for extensibility**
- ✨ **Full TypeScript support with strict typing**
- ✨ **Optimized for cloud deployment**
- ✨ **Correlation ID tracking for request tracing**
- ✨ **Comprehensive security features and headers management**

## 🛠 Installation
```bash
## Prerequisites

- Node.js 16+ and npm/yarn/pnpm
- PostgreSQL database
- AWS account for Parameter Store (optional)

## Setup

1. Clone the repository:

git clone https://github.com/ElsiKora/X-Captcha-Server.git
cd X-Captcha-Server


2. Install dependencies:

pnpm install


3. Configure environment variables:

cp .env.example .env


4. Edit the `.env` file with your configuration:

APPLICATION=xcaptcha
NODE_ENV=development
AWS_REGION=us-east-1
ENVIRONMENT=dev
SENTRY_DSN=your-sentry-dsn


5. Set up AWS Parameter Store parameters (if using AWS):
- `/xcaptcha/api/port`: Port number (e.g., 4000)
- `/xcaptcha/api/listener`: Listener interface (e.g., 0.0.0.0)
- `/xcaptcha/api/version`: API version (e.g., 1)
- `/xcaptcha/api/url`: Production API URL
- `/xcaptcha/api/terms-url`: Terms of service URL

6. Build the application:

pnpm run build


7. Start the server:

pnpm run start:prod
```

## 💡 Usage
# Using X-Captcha-Server

## API Authentication

X-Captcha-Server uses two types of authentication keys:

- **Public Key**: Used by your frontend to create and solve challenges
- **Secret Key**: Used by your backend to verify challenge solutions

Each client must be registered in the system with both keys.

### Authentication Headers

```typescript
// For public endpoints (frontend)
headers: {
  'X-Public-Key': 'your-public-key-here'
}

// For secret endpoints (backend verification)
headers: {
  'X-Secret-Key': 'your-secret-key-here'
}
```

## Creating a Challenge

To create a new CAPTCHA challenge for your user:

```typescript
import axios from 'axios';

async function createChallenge() {
  const response = await axios.post('https://your-api-domain.com/v1/challenge', {
    type: 'pow' // or 'click'
  }, {
    headers: {
      'X-Public-Key': 'your-public-key-here'
    }
  });
  
  return response.data;
}

// Example response:
// {
//   "id": "4a9e7c3d-8f5b-4e1a-b3d6-2c7a8d9e6f5b",
//   "type": "pow",
//   "data": {
//     "challenge": "683d2b8b9b06b518de4b55e6f289e5fd",
//     "difficulty": 5,
//     "type": "pow"
//   },
//   "createdAt": "2023-03-15T12:34:56.789Z"
// }
```

## Solving a PoW Challenge

For Proof-of-Work challenges, your frontend needs to find a nonce that satisfies the difficulty requirement:

```javascript
// Frontend code example
function solvePowChallenge(challenge, difficulty) {
  const crypto = window.crypto.subtle;
  let nonce = 0;
  
  while (true) {
    const message = challenge + nonce;
    const hashBuffer = await crypto.digest('SHA-256', new TextEncoder().encode(message));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Check if hash has 'difficulty' number of leading zeros
    if (hashHex.startsWith('0'.repeat(difficulty))) {
      return {
        nonce: nonce.toString(),
        hash: hashHex
      };
    }
    
    nonce++;
  }
}

async function submitSolution(challengeId, solution) {
  const response = await axios.post(`https://your-api-domain.com/v1/challenge/${challengeId}/solve`, {
    solution: {
      type: 'pow',
      nonce: solution.nonce,
      hash: solution.hash
    }
  }, {
    headers: {
      'X-Public-Key': 'your-public-key-here'
    }
  });
  
  return response.data; // Contains the verification token
}
```

## Solving a Click Challenge

For click challenges, the user needs to perform a simple action:

```javascript
async function submitClickSolution(challengeId) {
  const response = await axios.post(`https://your-api-domain.com/v1/challenge/${challengeId}/solve`, {
    solution: {
      type: 'click',
      data: true
    }
  }, {
    headers: {
      'X-Public-Key': 'your-public-key-here'
    }
  });
  
  return response.data; // Contains the verification token
}
```

## Verifying a Challenge Solution (Server-side)

After the user has solved a challenge, you'll receive a token. Your backend should verify this token:

```typescript
import axios from 'axios';

async function verifyCaptchaSolution(challengeId, token) {
  try {
    const response = await axios.post(`https://your-api-domain.com/v1/challenge/${challengeId}/verify`, {
      token: token
    }, {
      headers: {
        'X-Secret-Key': 'your-secret-key-here'
      }
    });
    
    return response.data.isSolved; // true if the challenge was solved correctly
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
}
```

## Complete Integration Example

Here's a complete flow for integrating X-Captcha into a login form:

```typescript
// Backend API example (Express)
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// Frontend gets a challenge
app.get('/api/captcha/challenge', async (req, res) => {
  try {
    const response = await axios.post('https://your-captcha-server.com/v1/challenge', {
      type: 'pow'
    }, {
      headers: {
        'X-Public-Key': process.env.XCAPTCHA_PUBLIC_KEY
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create captcha challenge' });
  }
});

// Handle login with captcha verification
app.post('/api/login', async (req, res) => {
  const { username, password, captchaToken, challengeId } = req.body;
  
  // Verify the captcha solution
  try {
    const verifyResponse = await axios.post(`https://your-captcha-server.com/v1/challenge/${challengeId}/verify`, {
      token: captchaToken
    }, {
      headers: {
        'X-Secret-Key': process.env.XCAPTCHA_SECRET_KEY
      }
    });
    
    if (!verifyResponse.data.isSolved) {
      return res.status(403).json({ error: 'CAPTCHA verification failed' });
    }
    
    // Continue with username/password validation
    // ...
    
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Docker Deployment

You can also run X-Captcha-Server using Docker:

```bash
# Build the Docker image
docker build -t x-captcha-server .

# Run the container
docker run -p 4000:4000 \
  -e APPLICATION=xcaptcha \
  -e NODE_ENV=production \
  -e AWS_REGION=us-east-1 \
  -e ENVIRONMENT=prod \
  -e SENTRY_DSN=your-sentry-dsn \
  x-captcha-server
```

## 🛣 Roadmap
| Task / Feature | Status |
|---------------|--------|
| Proof-of-Work Challenges | ✅ Done |
| Click-based Challenges | ✅ Done |
| Client Authentication | ✅ Done |
| Challenge Creation | ✅ Done |
| Challenge Verification | ✅ Done |
| AWS Parameter Store Integration | ✅ Done |
| Sentry Integration | ✅ Done |
| CloudWatch Logging | ✅ Done |
| API Documentation with Swagger | ✅ Done |
| Correlation ID Tracking | ✅ Done |
| Rate Limiting | 🚧 In Progress |
| Image-based CAPTCHA Challenges | 🚧 In Progress |
| Challenge Expiration Management | 🚧 In Progress |
| OAuth2 Authentication | 🚧 In Progress |
| JavaScript SDK | 🚧 In Progress |
| React Component | 🚧 In Progress |
| Analytics Dashboard | 🚧 In Progress |
| Geolocation-based Rules | 🚧 In Progress |
| Behavioral Analysis | 🚧 In Progress |
| Machine Learning for Bot Detection | 🚧 In Progress |

## ❓ FAQ
## Frequently Asked Questions

### General Questions

**Q: What is X-Captcha-Server?**
A: X-Captcha-Server is a server-side implementation for CAPTCHA challenges that helps protect your web applications from automated bots and abuse.

**Q: How is this different from Google reCAPTCHA?**
A: X-Captcha-Server is a self-hosted solution that gives you complete control over your CAPTCHA implementation without sharing data with third parties. It offers different challenge types like Proof-of-Work that don't require user interaction in some cases.

**Q: What challenge types are supported?**
A: Currently, X-Captcha-Server supports Proof-of-Work (PoW) and click-based challenges. More types are planned for future releases.

### Technical Questions

**Q: Can I use X-Captcha-Server without AWS?**
A: Yes, although some features like Parameter Store and CloudWatch are integrated with AWS, you can configure the application to work without these services by setting environment variables directly.

**Q: Is X-Captcha-Server suitable for high-traffic websites?**
A: Yes, the server is designed to handle high traffic volumes. For very large-scale deployments, consider implementing a load balancer and deploying multiple instances.

**Q: How do I generate client keys?**
A: Client keys (public and secret) are automatically generated when you create a new client in the database. You'll need to create initial clients manually or through a seed script.

**Q: Can I customize the difficulty of PoW challenges?**
A: Yes, the difficulty level for PoW challenges can be configured on a per-client basis through the database configuration.

**Q: How long are solved challenges valid for?**
A: Challenges expire after a configurable period. By default, challenges must be solved within 60 seconds of creation, but this can be adjusted.

### Integration Questions

**Q: Can I use X-Captcha-Server with my React/Vue/Angular application?**
A: Yes, X-Captcha-Server provides a RESTful API that can be integrated with any frontend framework. We're also working on specific frontend SDKs for popular frameworks.

**Q: Is there a JavaScript SDK available?**
A: A JavaScript SDK is currently in development and will be available soon.

**Q: Can I integrate X-Captcha-Server with my existing authentication system?**
A: Yes, X-Captcha-Server is designed to work alongside your existing authentication system. You can use it as an additional verification step in your authentication flow.

## 🔒 License
This project is licensed under **MIT License

Copyright (c) 2025 ElsiKora

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.**.

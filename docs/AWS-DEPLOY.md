# Deploying The Golden Fork on AWS

Complete step-by-step guide with **3 AWS options**, from easiest to most flexible.

---

## Prerequisites (All Options)

### 0. Make Sure You Have

- **Docker Desktop** installed and running ([download](https://www.docker.com/products/docker-desktop/))
- **Git** installed (`git --version` to check)
- An **AWS account** ([sign up free](https://aws.amazon.com/free/))

### 1. Install the AWS CLI

```bash
# macOS
brew install awscli

# Windows
winget install Amazon.AWSCLI

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
```

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your Access Key ID, Secret Access Key, Region (e.g. us-east-1), output (json)
```

> Don't have credentials? Go to [AWS IAM Console](https://console.aws.amazon.com/iam/) → Users → Create User → Attach "AdministratorAccess" policy → Create Access Key.

### 3. Push Your Code to GitHub

```bash
cd the-golden-fork
git init
git add .
git commit -m "Initial commit - The Golden Fork"

# Create the repo (using GitHub CLI)
gh repo create the-golden-fork --public --push

# OR manually:
git remote add origin https://github.com/YOUR_USERNAME/the-golden-fork.git
git branch -M main
git push -u origin main
```

---

## Option A: AWS App Runner (Easiest — Recommended)

**Best for**: Portfolio demos, quick deployment
**Cost**: ~$5–15/month (auto-scales to zero when idle)
**Supports**: WebSocket ✅, Auto-HTTPS ✅, Custom domain ✅

### Step 1 — Create an ECR Repository

App Runner needs your Docker image in AWS Elastic Container Registry (ECR).

```bash
# Create the repository
aws ecr create-repository \
  --repository-name the-golden-fork \
  --region us-east-1

# Save the URI it returns — you'll need it (looks like: 123456789012.dkr.ecr.us-east-1.amazonaws.com/the-golden-fork)
```

### Step 2 — Build and Push Your Docker Image

```bash
# Log into ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build the image (replace YOUR_DOMAIN later, or use placeholder)
docker build \
  --build-arg NEXT_PUBLIC_BASE_URL=https://placeholder.awsapprunner.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://placeholder.awsapprunner.com \
  -t the-golden-fork .

# Tag it for ECR
docker tag the-golden-fork:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/the-golden-fork:latest

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/the-golden-fork:latest
```

> **Replace** `123456789012` with your actual AWS Account ID from Step 1.

### Step 3 — Create the App Runner Service

```bash
# Create a file called apprunner.json
cat > apprunner.json << 'EOF'
{
  "ServiceName": "the-golden-fork",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "123456789012.dkr.ecr.us-east-1.amazonaws.com/the-golden-fork:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "WS_PORT": "3002"
        }
      }
    },
    "AutoDeploymentsEnabled": false,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::123456789012:role/AppRunnerECRAccessRole"
    }
  },
  "InstanceConfiguration": {
    "Cpu": "0.5 vCPU",
    "Memory": "1 GB"
  }
}
EOF
```

**Before running this**, you need to create the IAM role that lets App Runner pull from ECR:

```bash
# Create the trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the IAM role
aws iam create-role \
  --role-name AppRunnerECRAccessRole \
  --assume-role-policy-document file://trust-policy.json

# Attach the ECR access policy
aws iam attach-role-policy \
  --role-name AppRunnerECRAccessRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess

# Wait ~10 seconds for the role to propagate, then create the service
aws apprunner create-service --cli-input-json file://apprunner.json --region us-east-1
```

### Step 4 — Get Your URL

```bash
# Check deployment status
aws apprunner list-services --region us-east-1

# Look for "ServiceUrl" in the output — it'll be something like:
# abcdef1234.us-east-1.awsapprunner.com
```

Once status shows `RUNNING`, your app is live at `https://abcdef1234.us-east-1.awsapprunner.com`

### Step 5 — Rebuild with the Real URL

Now that you know your domain, rebuild with the correct URLs:

```bash
# Rebuild with correct domain (replace with YOUR actual URL from Step 4)
docker build \
  --build-arg NEXT_PUBLIC_BASE_URL=https://abcdef1234.us-east-1.awsapprunner.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://abcdef1234.us-east-1.awsapprunner.com \
  -t the-golden-fork .

# Tag and push again
docker tag the-golden-fork:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/the-golden-fork:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/the-golden-fork:latest

# Get your service ARN (copy the "ServiceArn" value from the output)
aws apprunner list-services --region us-east-1 --query 'ServiceSummaryList[?ServiceName==`the-golden-fork`].ServiceArn' --output text

# Trigger redeployment (paste the ServiceArn from above)
aws apprunner start-deployment \
  --service-arn YOUR_SERVICE_ARN_HERE \
  --region us-east-1
```

> **Note on WebSocket**: App Runner only exposes port 3000 publicly. The WebSocket server runs internally on port 3002 inside the container. The app's HTTP polling fallback kicks in automatically if the browser can't reach the WebSocket directly — your KDS board will still update in real-time via 5-second polling.

### Quick Console Alternative

If CLI feels complex, use the AWS Console instead:

1. Go to [App Runner Console](https://console.aws.amazon.com/apprunner/)
2. Click **Create service**
3. Source: **Container registry** → **Amazon ECR** → Select your image
4. Port: **3000**
5. CPU: **0.5 vCPU**, Memory: **1 GB** (runs two processes: web + WebSocket)
6. Environment variables: Add `NODE_ENV=production`
7. Click **Create & deploy**

---

## Option B: AWS Lightsail Container (Simple + Cheap)

**Best for**: Persistent demos, small budget
**Cost**: $10/month flat (Micro plan)
**Supports**: WebSocket ✅, Auto-HTTPS ✅, Custom domain ✅

### Step 1 — Install Lightsail Plugin

```bash
# Install the Lightsail control plugin
# macOS/Linux
curl "https://s3.us-west-2.amazonaws.com/lightsailctl/latest/linux-amd64/lightsailctl" -o /usr/local/bin/lightsailctl
chmod +x /usr/local/bin/lightsailctl
```

### Step 2 — Create the Container Service

```bash
aws lightsail create-container-service \
  --service-name golden-fork \
  --power micro \
  --scale 1 \
  --region us-east-1
```

> `micro` = 0.5 vCPU + 1GB RAM at $10/month. This runs both the Next.js app and WebSocket server. For heavier use, try `small` ($25/mo).

### Step 3 — Build and Push Your Image

```bash
# Build the Docker image
docker build \
  --build-arg NEXT_PUBLIC_BASE_URL=https://placeholder.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://placeholder.com \
  -t the-golden-fork .

# Push directly to Lightsail (no ECR needed!)
aws lightsail push-container-image \
  --service-name golden-fork \
  --label app \
  --image the-golden-fork:latest \
  --region us-east-1

# Note the image name it returns, e.g.:
# :golden-fork.app.1
```

### Step 4 — Deploy the Container

```bash
# Create deployment config
cat > lightsail-deploy.json << 'EOF'
{
  "containers": {
    "app": {
      "image": ":golden-fork.app.1",
      "ports": {
        "3000": "HTTP"
      },
      "environment": {
        "NODE_ENV": "production",
        "WS_PORT": "3002"
      }
    }
  },
  "publicEndpoint": {
    "containerName": "app",
    "containerPort": 3000,
    "healthCheck": {
      "path": "/api/health",
      "intervalSeconds": 30,
      "timeoutSeconds": 5,
      "healthyThreshold": 2,
      "unhealthyThreshold": 5
    }
  }
}
EOF

# Deploy
aws lightsail create-container-service-deployment \
  --service-name golden-fork \
  --cli-input-json file://lightsail-deploy.json \
  --region us-east-1
```

### Step 5 — Get Your URL

```bash
aws lightsail get-container-services --service-name golden-fork --region us-east-1
```

Look for `url` in the output — something like `https://golden-fork.ABC123.us-east-1.cs.amazonlightsail.com`.

Then rebuild with the real URL (same as App Runner Step 5).

---

## Option C: AWS EC2 (Full Control)

**Best for**: Learning, production setups, full server control
**Cost**: ~$3.50/month (t3.micro) — Free Tier eligible for 12 months
**Supports**: Everything ✅ (you control the server)

### Step 1 — Launch an EC2 Instance

```bash
# Create a key pair for SSH access
aws ec2 create-key-pair \
  --key-name golden-fork-key \
  --query 'KeyMaterial' \
  --output text > golden-fork-key.pem

chmod 400 golden-fork-key.pem

# Find the latest Amazon Linux 2023 AMI
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*-x86_64" "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

echo "Using AMI: $AMI_ID"
```

### Step 2 — Create a Security Group

```bash
# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name golden-fork-sg \
  --description "The Golden Fork - Web + WebSocket" \
  --query 'GroupId' --output text)

# Allow SSH (port 22)
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0

# Allow HTTP (port 80)
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0

# Allow HTTPS (port 443)
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

# Allow Next.js direct access (port 3000) — for initial testing without Caddy
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0

# Allow WebSocket direct access (port 3002) — for initial testing without Caddy
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3002 --cidr 0.0.0.0/0

echo "Security Group: $SG_ID"
```

### Step 3 — Launch the Instance

```bash
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.micro \
  --key-name golden-fork-key \
  --security-group-ids $SG_ID \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=golden-fork}]' \
  --query 'Instances[0].InstanceId' --output text)

echo "Instance: $INSTANCE_ID"

# Wait for it to start
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get the public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo "Your server IP: $PUBLIC_IP"
```

### Step 4 — SSH In and Install Docker

```bash
# SSH into the instance
ssh -i golden-fork-key.pem ec2-user@$PUBLIC_IP
```

Once inside the EC2 instance:

```bash
# Update system
sudo dnf update -y

# Install Docker
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes
exit
```

```bash
# SSH back in
ssh -i golden-fork-key.pem ec2-user@$PUBLIC_IP
```

### Step 5 — Clone and Deploy

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/the-golden-fork.git
cd the-golden-fork

# Create environment file
cp .env.example .env.local

# Edit with your values (or leave blank for demo mode)
nano .env.local
# Set:
#   NEXT_PUBLIC_BASE_URL=http://YOUR_EC2_PUBLIC_IP
#   NEXT_PUBLIC_WS_URL=ws://YOUR_EC2_PUBLIC_IP:3002

# Build and run
docker compose up --build -d

# Verify it's running
docker compose ps
curl http://localhost:3000/api/health
```

Your app is now live at `http://YOUR_EC2_PUBLIC_IP:3000`

### Step 6 — Add HTTPS with Caddy (Recommended)

For a proper portfolio demo, you want HTTPS and a clean domain. Caddy handles SSL automatically and proxies both HTTP traffic (Next.js on 3000) and WebSocket traffic (WS server on 3002) through a single domain.

```bash
# Install Caddy
sudo dnf install -y 'dnf-command(copr)'
sudo dnf copr enable @caddy/caddy -y
sudo dnf install -y caddy

# Create Caddyfile (replace yourdomain.com with your actual domain)
sudo tee /etc/caddy/Caddyfile > /dev/null << 'EOF'
yourdomain.com {
    # WebSocket connections get routed to port 3002
    # This MUST come before the general reverse_proxy
    @websockets {
        header Connection *Upgrade*
        header Upgrade    websocket
    }
    reverse_proxy @websockets localhost:3002

    # Everything else goes to Next.js on port 3000
    reverse_proxy localhost:3000
}
EOF

# Start Caddy (auto-obtains SSL certificate from Let's Encrypt)
sudo systemctl enable caddy
sudo systemctl start caddy
```

> **Domain setup**: Point your domain's DNS A record to your EC2 public IP. If you don't have a domain, use [duckdns.org](https://duckdns.org) for a free subdomain, or skip Caddy and just use the raw IP directly (`http://YOUR_IP:3000`).

Then update `.env.local` so the app knows its public URLs:
```bash
nano .env.local
# Change these two lines:
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
```

Rebuild with the new env vars baked in:
```bash
docker compose up --build -d
```

> **How it works**: When a browser connects to `wss://yourdomain.com`, Caddy detects the WebSocket upgrade header and routes it to the WS server (port 3002). All other traffic goes to Next.js (port 3000). Both use the same domain — no extra ports needed.

### Step 7 — Allocate an Elastic IP (Optional but Recommended)

EC2 public IPs change if the instance stops. Fix this with an Elastic IP:

```bash
# Allocate a static IP
ALLOC_ID=$(aws ec2 allocate-address --query 'AllocationId' --output text)

# Associate it with your instance
aws ec2 associate-address --instance-id $INSTANCE_ID --allocation-id $ALLOC_ID

# Get the new static IP
aws ec2 describe-addresses --allocation-ids $ALLOC_ID --query 'Addresses[0].PublicIp' --output text
```

---

## After Deployment — For All Options

### Verify Everything Works

Open these URLs in your browser:

| Page | URL |
|------|-----|
| Customer Menu | `https://YOUR_DOMAIN/order?table=5` |
| Owner Dashboard | `https://YOUR_DOMAIN/dashboard` |
| Health Check | `https://YOUR_DOMAIN/api/health` |

### Optional: Enable Full Features

The app runs in **demo mode** by default (no API keys needed). To enable real AI and payments:

**AI Chatbot** (OpenAI + Pinecone):
1. Get keys from [platform.openai.com](https://platform.openai.com/api-keys) and [app.pinecone.io](https://app.pinecone.io)
2. Create a Pinecone index: name `restaurant-menu`, dimension `1536`, metric `cosine`
3. Add keys to your environment variables
4. Seed the menu: `npm run seed` (or `docker compose exec app npm run seed`)

**Stripe Payments**:
1. Get test keys from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Add keys to your environment variables
3. Set up webhook: `https://YOUR_DOMAIN/api/webhooks/stripe`

---

## Cost Comparison

| Option | Monthly Cost | Difficulty | WebSocket | Auto-HTTPS | Best For |
|--------|-------------|------------|-----------|------------|----------|
| App Runner | $7–18 | Medium | Polling* | ✅ | Quick production demos |
| Lightsail | $10 flat | Easy | Polling* | ✅ | Budget-friendly |
| EC2 + Caddy | $3.50+ | Harder | ✅ Full | ✅ (with Caddy) | Full control, real WS |

> \* App Runner and Lightsail only expose one port publicly. WebSocket works **inside** the container but the browser uses HTTP polling fallback (every 5s) — still real-time, just slightly less instant. EC2 with Caddy gives you true WebSocket connections.

> **Free Tier**: EC2 t3.micro is free for 12 months on new AWS accounts.

---

## Cleanup (Stop Paying)

### App Runner
```bash
aws apprunner delete-service --service-arn YOUR_SERVICE_ARN --region us-east-1
aws ecr delete-repository --repository-name the-golden-fork --force --region us-east-1
```

### Lightsail
```bash
aws lightsail delete-container-service --service-name golden-fork --region us-east-1
```

### EC2
```bash
aws ec2 terminate-instances --instance-ids $INSTANCE_ID
aws ec2 release-address --allocation-id $ALLOC_ID
aws ec2 delete-security-group --group-id $SG_ID
aws ec2 delete-key-pair --key-name golden-fork-key
rm golden-fork-key.pem
```

---

## Troubleshooting

**Docker build fails locally**: Make sure Docker Desktop is running. On Mac, you may need to enable "Use Rosetta for x86/amd64 emulation" in Docker settings for ARM compatibility.

**App Runner deploy stuck**: Check logs with `aws apprunner list-operations --service-arn YOUR_ARN`. Most common issue is the IAM role not having ECR access.

**EC2 can't be reached**: Check that security group allows inbound traffic on ports 80, 443, and 3000. Run `aws ec2 describe-security-groups --group-ids $SG_ID` to verify.

**WebSocket won't connect**: Make sure port 3002 is exposed. For Caddy/Nginx, ensure WebSocket upgrade headers are proxied (the Caddyfile above handles this).

**Health check failing**: Hit `/api/health` directly. If it returns JSON, the app is running. If 502/503, check container logs: `docker compose logs -f`

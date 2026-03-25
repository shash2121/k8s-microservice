# Kubernetes Migration Guide

## Changes Made for Kubernetes Compatibility

### 1. Backend Services (Node.js)

All four microservices have been updated to use **environment variables** for service discovery instead of hardcoded `localhost` URLs.

#### Environment Variables Added:

```bash
# Service URLs (used for CORS and inter-service communication)
CATALOG_SERVICE_URL=http://catalog-service:3001
CART_SERVICE_URL=http://cart-service:3002
CHECKOUT_SERVICE_URL=http://checkout-service:3003
LANDING_SERVICE_URL=http://landing-service:3000

# Database Configuration
DB_HOST=rds-external          # Kubernetes ExternalName service for RDS
DB_PORT=3306
DB_NAME=shophub
DB_USER=<from-secrets>
DB_PASSWORD=<from-secrets>

# Application Settings
NODE_ENV=production
PORT=3000  # or 3001, 3002, 3003 depending on service
```

#### Files Modified:

| Service | File | Changes |
|---------|------|---------|
| landing-service | `src/app.js` | Added service URLs, dynamic CORS origins |
| cart-service | `src/app.js` | Added service URLs, dynamic CORS origins |
| catalog-service | `src/app.js` | Added service URLs, dynamic CORS origins |
| checkout-service | `src/app.js` | Added service URLs, dynamic CORS origins |

---

### 2. Frontend JavaScript Files

Frontend files now use **relative paths** instead of absolute URLs because all traffic goes through the **AWS ALB Ingress**.

#### Before (Hardcoded URLs):
```javascript
const API_BASE = 'http://localhost:3000/api/auth';
const CATALOG_URL = 'http://localhost:3001';
const CART_API_BASE = 'http://localhost:3002/api/cart';
```

#### After (Relative Paths via Ingress):
```javascript
const API_BASE = window.APP_CONFIG?.API_BASE || '/api/auth';
const CATALOG_URL = window.APP_CONFIG?.CATALOG_URL || '/';
const CART_API_BASE = window.APP_CONFIG?.CART_API_BASE || '/api/cart';
```

#### Files Modified:

| File | Service | Changes |
|------|---------|---------|
| `public/js/login.js` | landing-service | Uses relative paths |
| `public/js/signup.js` | landing-service | Uses relative paths |
| `public/app.js` | catalog-service | Uses relative paths |
| `public/js/cart.js` | cart-service | Uses relative paths |
| `public/js/checkout.js` | checkout-service | Uses relative paths |

---

### 3. Kubernetes Resources Created

#### ConfigMap (`common/05-configmap.yaml`)
Stores configuration that's shared across services:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: shophub-app-config
  namespace: shophub
data:
  CATALOG_SERVICE_URL: "http://catalog-service:3001"
  CART_SERVICE_URL: "http://cart-service:3002"
  CHECKOUT_SERVICE_URL: "http://checkout-service:3003"
  DB_HOST: "rds-external"
  # ... more config
```

#### How Services Use ConfigMap:

**Option 1: As Environment Variables** (Recommended for backend)
```yaml
envFrom:
  - configMapRef:
      name: shophub-app-config
```

**Option 2: As Volume Mount** (For frontend config)
```yaml
volumes:
  - name: app-config
    configMap:
      name: shophub-app-config
volumeMounts:
  - name: app-config
    mountPath: /app/config
```

---

### 4. Service Communication Flow

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Application Load Balancer          │
│                         (Ingress)                         │
└────────────┬──────────────────────────────────────────────┘
             │
             ├─ /api/auth/*        → landing-service:3000
             │
             ├─ /api/products/*    → catalog-service:3001
             │
             ├─ /api/cart/*        → cart-service:3002
             │
             ├─ /api/checkout/*    → checkout-service:3003
             │
             └─ /*                 → landing-service:3000
```

#### Ingress Routing:
- All frontend traffic goes to landing-service (main entry point)
- API calls are routed to appropriate services based on path
- Services communicate internally using Kubernetes DNS

---

### 5. Database Connection

#### RDS ExternalName Service (`common/04-rds-externalname.yaml`):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: rds-external
  namespace: shophub
spec:
  type: ExternalName
  externalName: your-rds-endpoint.ap-south-1.rds.amazonaws.com
```

#### How Services Connect:
```javascript
// In database config
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'rds-external',  // Kubernetes service name
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'shophub'
});
```

---

### 6. Secrets Management

#### Using AWS Secrets Manager + CSI Driver:

1. **SecretProviderClass** (`common/02-secretproviderclass.yaml`)
   - Fetches secrets from AWS Secrets Manager
   - Syncs to Kubernetes secrets

2. **Pod Identity Association**
   - ServiceAccount has IAM role annotation
   - Pods authenticate with AWS using IRSA/PIA

3. **Deployment Volume Mount**
```yaml
volumes:
  - name: secrets-store-inline
    csi:
      driver: secrets-store.csi.k8s.io
      volumeAttributes:
        secretProviderClass: "shophub-secrets"
volumeMounts:
  - name: secrets-store-inline
    mountPath: "/mnt/secrets-store"
    readOnly: true
```

---

## Deployment Checklist

### Before Deploying:

1. **Update RDS Endpoint**
   ```bash
   # Edit common/04-rds-externalname.yaml
   externalName: your-actual-rds-endpoint.ap-south-1.rds.amazonaws.com
   ```

2. **Update IAM Role ARN**
   ```bash
   # Edit common/03-serviceaccounts.yaml
   eks.amazonaws.com/role-arn: arn:aws:iam::YOUR-ACCOUNT-ID:role/your-role
   ```

3. **Update Ingress Host** (if using custom domain)
   ```bash
   # Edit ingress/ingress.yaml
   host: shophub.your-domain.com
   ```

4. **Build and Push Docker Images**
   ```bash
   # From k8s-microservices folder
   docker build -t sha2121/shophub-landing-page:k8s ./landing-service
   docker build -t sha2121/shophub-catalog:k8s ./catalog-service
   docker build -t sha2121/shophub-cart:k8s ./cart-service
   docker build -t sha2121/shophub-checkout:k8s ./checkout-service
   
   docker push sha2121/shophub-landing-page:k8s
   docker push sha2121/shophub-catalog:k8s
   docker push sha2121/shophub-cart:k8s
   docker push sha2121/shophub-checkout:k8s
   ```

### Deploy Order:

```bash
# 1. Common resources (namespace, secrets, config)
kubectl apply -f common/

# 2. Deploy services
kubectl apply -f landing-service/
kubectl apply -f catalog-service/
kubectl apply -f cart-service/
kubectl apply -f checkout-service/

# 3. Deploy Ingress
kubectl apply -f ingress/

# 4. Verify
kubectl get pods -n shophub
kubectl get svc -n shophub
kubectl get ingress -n shophub
```

---

## Testing Inter-Service Communication

### 1. Test DNS Resolution
```bash
# From any pod in the namespace
kubectl run -it --rm --restart=Never test-ns --image=busybox --namespace=shophub -- nslookup catalog-service
```

### 2. Test Service Connectivity
```bash
# From landing-service pod
kubectl exec -it <landing-pod> -n shophub -- curl http://catalog-service:3001/health
kubectl exec -it <landing-pod> -n shophub -- curl http://cart-service:3002/health
kubectl exec -it <landing-pod> -n shophub -- curl http://checkout-service:3003/health
```

### 3. Test Database Connection
```bash
# From checkout-service pod
kubectl exec -it <checkout-pod> -n shophub -- nc -zv rds-external 3306
```

---

## Troubleshooting

### CORS Errors
If you see CORS errors in browser console:
```bash
# Check if ALLOWED_ORIGINS is set correctly
kubectl get deploy -n shophub -o yaml | grep ALLOWED_ORIGINS

# Update ConfigMap if needed
kubectl edit configmap shophub-app-config -n shophub
```

### Service Discovery Issues
If services can't find each other:
```bash
# Check services exist
kubectl get svc -n shophub

# Check DNS
kubectl run -it --rm --restart=Never test-dns --image=busybox --namespace=shophub -- nslookup <service-name>
```

### Database Connection Issues
```bash
# Check RDS endpoint
kubectl get svc rds-external -n shophub

# Check secrets are mounted
kubectl exec -it <pod-name> -n shophub -- ls -la /mnt/secrets-store
```

---

## Key Differences: Local vs Kubernetes

| Aspect | Local Development | Kubernetes |
|--------|------------------|------------|
| Service URLs | `localhost:300X` | `service-name:port` |
| CORS | Specific localhost URLs | Service names or `*` |
| Database | `localhost:3306` | `rds-external:3306` |
| Frontend API calls | `http://localhost:300X/api/...` | `/api/...` (via Ingress) |
| Config | `.env` files | ConfigMaps + Secrets |
| Service Discovery | Hardcoded | Kubernetes DNS |

---

## Next Steps

1. ✅ Code changes complete
2. ⏳ Build and push Docker images
3. ⏳ Update manifests with correct image tags
4. ⏳ Apply Kubernetes manifests
5. ⏳ Test all services

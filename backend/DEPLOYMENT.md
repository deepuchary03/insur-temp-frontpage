# Deployment Guide - Render Web Service

## Prerequisites

1. A Render account (https://render.com)
2. A MySQL database (you can use Render's MySQL or external like PlanetScale, AWS RDS)
3. Your environment variables ready

## Deploy to Render

### Option 1: Using Render Dashboard (Recommended)

1. **Create a new Web Service:**

   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service:**

   - **Name:** `insurance-backend` (or your choice)
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Build Context Directory:** `./` (leave default)

3. **Set Environment Variables:**
   Go to "Environment" tab and add:

   ```
   MYSQL_USERNAME=your_mysql_username
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=insurance_db
   SPRING_DATASOURCE_URL=jdbc:mysql://your-mysql-host:3306/insurance_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC

   JWT_SECRET=your_jwt_secret_at_least_32_characters_long
   JWT_ACCESS_TOKEN_EXPIRATION=3600000
   JWT_REFRESH_TOKEN_EXPIRATION=86400000

   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_gmail_app_password

   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Advanced Settings:**

   - **Health Check Path:** `/api/v1/health`
   - **Auto-Deploy:** Yes (recommended)

5. **Click "Create Web Service"**

### Option 2: Using render.yaml (Infrastructure as Code)

1. The `render.yaml` file is already configured in the backend directory
2. Update the environment variables in Render dashboard after deployment
3. Push to GitHub and Render will auto-deploy

## Database Setup

### Option A: Render PostgreSQL (Free Tier Available)

Note: You'll need to change the application to use PostgreSQL instead of MySQL

### Option B: External MySQL Database

**PlanetScale (Recommended - Free Tier):**

1. Create account at https://planetscale.com
2. Create a new database
3. Get connection string
4. Add to Render environment variables

**Railway MySQL:**

1. Create account at https://railway.app
2. Add MySQL database
3. Get connection string
4. Add to Render environment variables

**AWS RDS / Google Cloud SQL:**

1. Create MySQL instance
2. Configure security groups to allow Render IPs
3. Get connection string
4. Add to Render environment variables

## Post-Deployment

1. **Check Logs:**

   - Go to your service in Render dashboard
   - Click on "Logs" tab
   - Look for: "🚀 Online Corporate Insurance System Started Successfully!"

2. **Test Health Endpoint:**

   ```
   https://your-service-name.onrender.com/api/v1/health
   ```

3. **Update Frontend:**
   Update your frontend `.env` file:
   ```
   VITE_API_URL=https://your-service-name.onrender.com/api/v1
   ```

## Troubleshooting

### Issue: "Connection refused" to MySQL

- Check your database connection string
- Ensure database is accessible from Render's IPs
- Verify MYSQL_PASSWORD is correct

### Issue: "JWT secret too short"

- Ensure JWT_SECRET is at least 32 characters long
- Generate a strong secret: `openssl rand -base64 32`

### Issue: Email not sending

- Verify MAIL_USERNAME and MAIL_PASSWORD
- Ensure you're using Gmail App Password, not regular password
- Check Gmail security settings

### Issue: Gemini API not working

- Verify GEMINI_API_KEY is correct
- Check API quota limits
- Ensure API key has proper permissions

## Free Tier Limitations (Render)

- **750 hours/month** of free runtime
- Service **spins down after 15 minutes** of inactivity
- **Cold starts** take ~30 seconds
- 512 MB RAM limit

## Scaling to Paid Plan

For production workloads:

1. Upgrade to Starter plan ($7/month)
2. No cold starts
3. More RAM and CPU
4. Better performance

## CI/CD

Render automatically deploys when you push to your configured branch (main).

To disable auto-deploy:

1. Go to service settings
2. Turn off "Auto-Deploy"
3. Deploy manually when needed

## Monitoring

- Use Render's built-in metrics
- Set up email alerts for downtime
- Monitor logs for errors

## Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use strong JWT secrets
3. ✅ Use Gmail App Passwords
4. ✅ Rotate secrets regularly
5. ✅ Use HTTPS only (Render provides this automatically)
6. ✅ Keep dependencies updated

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: [Your repository]/issues

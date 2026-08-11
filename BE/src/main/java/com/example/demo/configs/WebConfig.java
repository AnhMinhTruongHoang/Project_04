package com.example.demo.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Value("${app.frontend-url:http://localhost:3000}")
	private String frontendUrl;

	// =====================================================
	// LEGACY LOCAL MEDIA
	// =====================================================

	@Override
	public void addResourceHandlers(
			ResourceHandlerRegistry registry) {

		registry.addResourceHandler(
				"/uploads/images/**")
				.addResourceLocations(
						"file:uploads/images/");

		registry.addResourceHandler(
				"/uploads/audio/**")
				.addResourceLocations(
						"file:uploads/audio/");
	}

	// =====================================================
	// CORS
	// =====================================================

	@Override
	public void addCorsMappings(CorsRegistry registry) {

		registry.addMapping("/**")
				.allowedOriginPatterns(
						// Next.js local
						"http://localhost:3000",
						"http://127.0.0.1:3000",

						// Flutter Web local (add your port if different)
						"http://localhost:*",
						"http://127.0.0.1:*",

						// Production frontend
						frontendUrl,

						// Vercel Preview
						"https://*.vercel.app")
				.allowedMethods(
						"GET",
						"POST",
						"PUT",
						"PATCH",
						"DELETE",
						"OPTIONS")
				.allowedHeaders("*")
				.exposedHeaders("*")
				.allowCredentials(true)
				.maxAge(3600);
	}
}
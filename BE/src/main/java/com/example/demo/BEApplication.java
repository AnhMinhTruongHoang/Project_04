package com.example.demo;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BEApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(
				TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));

		SpringApplication.run(
				BEApplication.class,
				args);
	}
}
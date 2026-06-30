package com.example.demo.configuration;

import java.util.Date;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.modelmapper.AbstractConverter;
import org.modelmapper.Converter;
import org.modelmapper.ModelMapper;
import org.modelmapper.PropertyMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import com.example.demo.dtos.UserDTO;
import com.example.demo.entities.User;
import com.example.demo.helpers.DateHelper;

@Configuration
public class ModelMapperConfiguration {
	@Autowired
	private Environment environment;

	@Bean
	public ModelMapper modelMapper() {
		ModelMapper mapper = new ModelMapper();

		mapper.addMappings(new PropertyMap<User, UserDTO>() {

			@Override
			protected void configure() {

				map().setId(source.getId());
				map().setEmail(source.getEmail());
				map().setUsername(source.getUsername());
				map().setName(source.getName());
				map().setRole(source.getRole());
				map().setAddress(source.getAddress());
				map().setAge(source.getAge());
				map().setGender(source.getGender());
				map().setIsVerify(source.getIsVerify());
				map().setType(source.getType());
			}
		});

		/* Converter */
		Converter<String, String> converterPhotoProductStringToString = new AbstractConverter<String, String>() {

			@Override
			protected String convert(String source) {
				return environment.getProperty("images_url") + source;
			}
		};

		/* Converter */
		Converter<Date, String> converterExpiredProductDateToString = new AbstractConverter<Date, String>() {

			@Override
			protected String convert(Date source) {
				return DateHelper.getDateDiff(source, new Date(), TimeUnit.DAYS) > 30 ? "Hết hạn" : "Còn hạn";
			}
		};

		return mapper;
	}
}

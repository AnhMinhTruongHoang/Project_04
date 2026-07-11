package com.example.demo.configuration;

import org.modelmapper.ModelMapper;
import org.modelmapper.PropertyMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import com.example.demo.dtos.UserDTO;
import com.example.demo.entities.User;

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

				map().setAge(source.getAge());

				map().setGender(source.getGender());

				map().setIsVerify(source.getIsVerify());

				map().setType(source.getType());

				map().setAvatarUrl(source.getAvatarUrl());

				map().setCoverUrl(source.getCoverUrl());

				map().setBio(source.getBio());

				map().setWebsite(source.getWebsite());

				map().setCity(source.getCity());

				map().setCountry(source.getCountry());

				map().setVerified(source.getVerified());

				map().setFollowers(source.getFollowers());

				map().setFollowing(source.getFollowing());

				map().setSubscriptionTier(source.getSubscriptionTier());

				map().setCreatedAt(source.getCreatedAt());

				map().setUpdatedAt(source.getUpdatedAt());
			}
		});

		return mapper;
	}

}
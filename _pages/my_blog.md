---
layout: default
permalink: /my_blog/
title: blog
nav: false
nav_order: 1
---

<div class="post">

{% assign blog_name_size = site.blog_name | size %}
{% assign blog_description_size = site.blog_description | size %}

{% if blog_name_size > 0 or blog_description_size > 0 %}

  <div class="header-bar">
    <h1>{{ site.blog_name }}</h1>
    <h2>{{ site.blog_description }}</h2>
     <p>Started a blog (again), but it should be here to stay! Come read on <a href='https://harmonbhasin.substack.com/about'>substack</a>.</p>
  </div>
  {% endif %}

</div>

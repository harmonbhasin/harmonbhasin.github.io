---
layout: page
permalink: /publications/
title: publications
description: Publications by categories in reversed chronological order. * denotes equal contribution.
nav: true
nav_order: 2
---

<!-- _pages/publications.md -->
<div class="publications">

{% bibliography --group_by none --query @*[presentation=false]* %}

</div>
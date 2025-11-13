---
title: "Computer Scientist's Guide to Stopping Pandemics"
description: "The introduction I wish I had to computational biosecurity."
date: '2025-11-03'
categories:
  - 'review'
  - 'biosurveillance'
published: true
---

Three and a half years ago, I started computational biology research with the goal of getting into biosecurity. Looking back, my biggest gap wasn’t in computation but in understanding the data generation process—how we go from a nasal swab to a text file of DNA, and where biosecurity fit within the broader landscape of biology research.

This post is the background I wish I’d had when starting out. It focuses on viral biosurveillance, the focus of my work when I was at the [Nucleic Acid Observatory (NAO)](https://naobservatory.org/), and is written for readers with a high-school grasp of biology. I start with a primer, then explain the type of measurement we're interested in, walk through the process from sample to analysis, touch on some engineering realities, then end with resources.

# Biology primer

To make sense of this post, you'll need baseline knowledge in molecular biology and virology[^1]. Here's the minimum knowledge to learn/review:

[^1]: You’ll eventually need some immunology and genomics, but they’re optional at first. [“An introduction to Immunology and Immunopathology”](https://doi.org/10.1186/s13223-018-0278-1) and ["Essential Cell Biology"](https://wwnorton.com/books/9781324033356) are solid starting points.

For molecular biology, make sure you can describe the major components of a cell, walk through the central dogma from DNA to RNA to proteins, and understand mutation types and how evolutionary pressure shapes genomic changes. ["Essential Cell Biology"](https://wwnorton.com/books/9781324033356) is one of the best textbooks I've found on this.

On the virology side, know how viruses replicate, how taxonomies group them, and which traits—genome type, tropism, transmission routes—make a pathogen dangerous. ["Principles of Virology"](https://www.wiley.com/en-us/Principles+of+Virology%2C+Multi-Volume%2C+5th+Edition-p-9781683673583) covers those basics plus more.

# Why untargeted metagenomics for viral biosurveillance 

Biology spans a range of phenomena, but a useful way to navigate this complexity is through the lens of measurement. There are two fundamental questions: what material are you measuring (sample) and what are you measuring (assay). Different assays capture different aspects of life: imaging assays reveal cellular structures, protein assays quantify molecular expression, and genetic assays read the underlying genetic material. To understand how we arrived at untargeted metagenomic sequencing for viral biosurveillance, we can trace the measurement decisions that narrow the field.

The first fundamental choice in genetic assays is between targeted and untargeted assays. Targeted assays work well when you already suspect a specific organism (amplicon sequencing) or gene (RT-qPCR). Untargeted approaches like shotgun sequencing read all genetic material in a sample, preserving whatever surprises might be there. This makes them ideal for [basic research](https://en.wikipedia.org/wiki/Basic_research)—studying microbial communities, investigating rare disease states, or exploring any system where you don't know what you're looking for.  For viral biosurveillance, shotgun sequencing becomes the default since we want to know about all viruses in a sample. 

Shotgun sequencing introduces two key design choices: what to characterize and at what resolution. For characterization, you can focus on individual genomes or on mixed communities containing many genomes (metagenomics). Importantly, the source material doesn't determine what you characterize—you can sequence human blood to study human cells or to characterize viral communities. For resolution, bulk sequencing extracts all genetic material together, giving averaged genetic material across the sample, while single-cell sequencing separates individual cells first, preserving which data came from which cells (useful for resolving heterogeneity, but more expensive). For viral biosurveillance, we focus on metagenomics as we want to know all viral communities in a sample, and bulk sequencing as it's cheaper than single-cell[^2] .

[^2]: There are probably more reasons, but I do not know them. One argument that comes to mind is that there might be a lot of cell-free DNA/RNA that would be missed. 

Finally, bulk metagenomic sequencing requires two choices: what molecule you're measuring and how you sequence it. Beyond basic DNA sequencing (DNA-seq) and RNA sequencing (RNA-seq), you can sequence other properties of genetic material—protein-DNA interactions (ChIP-seq), chromatin accessibility (ATAC-seq), or combine multiple approaches ([multi-omics](https://en.wikipedia.org/wiki/Multiomics)). However, these specialized "-seq" methods mostly appear in studies of individual organisms. Metagenomic studies usually stick to the basics: DNA-seq, RNA-seq, or mixed preparations that capture both simultaneously. Once you decide what molecule you're measuring, you choose your sequencing approach. Each sequencing run produces reads—short snippets of DNA or RNA that represent the raw output of the sequencing machine. Short reads (50-300 base pairs) are cheaper and more accurate per base, while long reads (thousands of base pairs) are better for resolving complex genomic structures. Within short reads, "single-end" sequences from one direction only, while "paired-end" sequences both ends of the same DNA fragment, providing additional structural information. The choice between short and long reads depends on sample characteristics: wastewater contains highly fragmented DNA that suits short-read sequencing, while nasal swabs preserve longer DNA fragments that benefit from long-read approaches.

These decisions bring us to untargeted metagenomic RNA sequencing, the approach used at the Nucleic Acid Observatory to detect RNA viruses. In practice, that means [short-read paired-end RNA-seq for wastewater](https://dx.doi.org/10.2139/ssrn.5187186) and [long-read RNA-seq for nasal swabs](https://naobservatory.org/blog/ont_rpdsmrt/).

# Sample-to-insight workflow

Now that we've narrowed down our measurement, we'll walk through the process from sample collection to virus identification. At each step, I'll outline key biosurveillance questions.

First, you must pick out your sample. Wastewater, blood, and nasal swabs each capture different viruses, reflect infections on different timescales, and come with distinct sampling logistics. Key questions: What types of samples should we collect, where should we collect them, and how often?

Second, we prepare our sample for sequencing through two steps: sample preparation and library preparation. Both steps depend on the sample’s composition and biomass, the target organism or molecule, and the sequencing technology used. During sample preparation, we extract nucleic acids (lysis), filter out unwanted material, and assess how much usable genetic material we recovered. During library preparation, we add the molecular components necessary for sequencing, including barcodes that allow us to sequence multiple samples together (multiplexing) while keeping track of which reads came from which sample. We also amplify the prepared libraries through PCR to generate sufficient material for sequencing. Key questions: What sample preparation optimizes recovery of our pathogens of interest? How can computational detections of novel viruses be validated experimentally?

Third, we use computational tooling and databases to analyze the text files produced from sequencing to identify viruses. Our process includes removing read artifacts, removing low-quality reads/samples, depleting host DNA (removing human/plant/animal reads), classifying reads by comparing against reference databases (using tools like Kraken or Bowtie), and calculating relative abundances (converting raw read counts to meaningful proportions across taxa). The resulting outputs then need to be analyzed—using downstream tools and custom scripts to interpret patterns, compare samples, and generate figures or summaries[^3]. Key questions: What algorithms and databases should we use for classification and contamination removal? How do we tune tool parameters and filtering thresholds? What do these data reveal about viral trends?

[^3]: Here is [an example analysis from Will Bradshaw](https://data.securebio.org/wills-public-notebook/notebooks/2024-05-07_munk.html). 

# Engineering realities in practice

The computational work sounds straightforward. It's not. We face three problems: handling terabytes of data, making tools work together, and validating without ground truth. These problems mean the pipeline is never finished—it's ongoing software that demands constant maintenance.

## Computational scale

The data volume breaks standard tools and requires distributed compute. We sequence billions of reads to detect rare viruses in wastewater, producing terabytes of data. Most bioinformatics tools can't handle this volume—they use too much memory or take too long. We turn to distributed computing to make analyses tractable, but it introduces new failures: jobs crash randomly, network requests get rate-limited, and layers of API abstraction hide problems that eventually arise.

## Tool integration

Making tools work together is constant engineering. Tools don't agree on file formats, so we preprocess outputs to make them compatible. Some need curated databases that can't be downloaded. Others expect specific input structures. Workflow software chains the pieces together but adds complexity of its own. 

## Validation uncertainty

We can't validate our results. We don't know what's in our samples. Biological validation would be the only real answer, but it's intractable. BLAST is too slow for all our data and can still be wrong. Without ground truth, we build representative datasets, make changes, and see what shifts. We balance accuracy against speed against feasibility, accepting that some questions have no clear answers.

# Resources

For structured guidance on entering biosecurity, I would start with ["Preventing catastrophic pandemics" by 80,000 hours](https://80000hours.org/problem-profiles/preventing-catastrophic-pandemics/). Below are technical resources relevant to this post's focus.

## Follow the field

People to follow on Twitter, LinkedIn, their personal blogs/Substacks, or the [EA Forum](https://forum.effectivealtruism.org/?tab=biosecurity):
- Tessa Alexanian
- Simon Grimm
- Seth Donoughe
- Jeff Kaufman
- Jacob Swett
- Andrew Snyder-Beattie
- Brian Wang
- Byron Cohen
- Sofya Lebedeva
- Joshua Teperowski Monrad

Communities to consider joining:
- [Nordic Biosecurity Group](https://nordicbiosecuritygroup.org/) (extensive resources)
- [Wisconsin Biosecurity Initiative ](https://www.wiscobiosec.org/)
- [Oxford Biosecurity Group](https://www.oxfordbiosecuritygroup.com/)
- [Cambridge Biosecurity Hub](https://www.cambiohub.org/)

Technical blogs:
- [NAO's blog](https://naobservatory.org/blog/)
- [Blueprint Biosecurity's blog](https://blueprintbiosecurity.org/posts/)
- [EA Forum's biosecurity section](https://forum.effectivealtruism.org/?tab=biosecurity)

For computational problems specifically, see Tessa Alexanian's [publications](https://scholar.google.com/citations?hl=en&user=5BTMKp8AAAAJ&view_op=list_works&sortby=pubdate)/[blog posts](https://forum.effectivealtruism.org/users/tessa-a) and the [section "Formalizing threat detection methods" from the NAO's blog post](https://naobservatory.org/reports/comparing-sampling-strategies-for-early-detection-of-stealth-biothreats/). New initiatives keep emerging—like [Biosecurity at NeurIPS](https://biosafe-gen-ai.github.io/index.html)—so watch for those.

## Experiment

Download datasets from NCBI and start off by reproducing published analyses. Answer concrete questions: which viruses appear in a sample? How do different tools classify reads? See [Will Bradshaw's](https://data.securebio.org/wills-public-notebook/) and [Dan Rice's](https://naobservatory.github.io/dans-public-notebook/)  notebooks for different flavors of computational work.

Try wild things. [Improve existing tools](https://github.com/jackdougle/nucleaze) or even [sequence your own DNA for <$2k](https://maxlangenkamp.substack.com/p/how-to-sequence-your-dna-for-2k).

## Join research

Work with existing groups: join a lab, apply to sprints like [Apart Research's CBRN AI Sprint](https://apartresearch.com/sprints/cbrn-ai-risks-sprint-2025-09-12-to-2025-09-14)[^4], or contribute to [open-source pipelines](https://github.com/securebio/nao-mgs-workflow).

[^4]: As of writing, another upcoming sprint is the [Defensive Acceleration Hackathon](https://apartresearch.com/sprints/def-acc-hackathon-2025-11-21-to-2025-11-23) (November 21-23, 2025).

Professors interested in biosecurity:
- Kevin Esvelt
- Charles Whittaker
- Oliver Crook
- Pardis Sabeti 

Organizations: Reach out to [AIxBio](https://securebio.org/ai/) or [NAO](https://naobservatory.org/) at SecureBio.

# Appendix

## Broader problem space

In this blog, my main focus was the data generation process and building a pipeline for viral biosurveillance. There are other interesting computational problems that I did not cover, but wanted to list as I haven't seen this list elsewhere:

- Writing simulations that allow you to model the [cost of metagenomic surveillance](https://naobservatory.org/blog/simulating-approaches-to-metagenomic-pandemic-identification/) and [compare sample types](https://naobservatory.org/blog/swab-based-p2ra/) and epidemiological models
- Phylogenetic and phylodynamic analysis
- Time-series analysis of metagenomic sequencing data
- Genetic engineering detection
- Genetic engineering attribution
- DNA synthesis screening
- Red teaming LLMs for biological capabilities
- Red teaming biological LMs (e.g. pLMs, gLMs, etc)

---

*All mistakes are my own. If you see errors, reach out at harmonsbhasin@gmail.com — I'll fix them. I also welcome feedback for learning.*


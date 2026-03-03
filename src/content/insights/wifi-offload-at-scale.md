---
title: "What Wi-Fi Offload Looks Like at 3.5 Million Daily Users"
description: "Building carrier Wi-Fi offload on the Helium network at scale, what makes the WBA work different, and why quality metrics change everything."
date: "2026-03-02"
tags: ["wifi-offload", "helium", "wba", "carrier-networks"]
---

Carrier Wi-Fi offload has been "the next big thing" for over a decade. Everyone talks about it. Almost nobody does it well at scale. I know, because I've been building one.

At Helium, we took a decentralized Wi-Fi network from zero to 3.5 million daily unique users in about eighteen months. That number keeps growing. And it forced us to confront every hard problem that the traditional offload playbook skips over.

The biggest one: quality. It's easy to offload subscribers to Wi-Fi. It's hard to offload them to Wi-Fi that actually delivers a good experience. Most carrier offload schemes treat any open access point as a valid target. The subscriber connects, the session counts as "offloaded," and everyone pats themselves on the back. Meanwhile the user is stuck on a congested residential AP wondering why their phone suddenly can't load a webpage.

That's the problem I've been working on with the WBA (the Wireless Broadband Alliance). We've been building a framework for quality-driven offload. The idea is straightforward: instrument the Wi-Fi network with real performance metrics, feed those metrics back to the subscriber's parent operator (the MNO or MVNO), and let the operator make an informed decision about whether to connect or reject a given access point.

It sounds obvious. But the industry has never had a standardized way to do it. The metrics didn't exist in a form operators could consume. The signaling wasn't there. We're building that layer now.

What makes Helium's approach different is that the network is already decentralized. The access points are deployed by independent operators. There's no single entity controlling the infrastructure. So quality measurement isn't optional. It's existential. Without it, you can't tell the difference between a well-run access point and one sitting in someone's basement with a 5 Mbps DSL backhaul.

Scale reveals truth. At 3.5 million daily users, you learn very quickly what works and what doesn't. And the answer, every time, is that quality is the only metric that matters.

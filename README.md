
# otp.js

A lightweight library for modular development of modern [OpenTripPlanner](http://opentripplanner.org) front-end interfaces.

The core of the library is a collection of data models and views (`lib/`), written using backbone.js, that encapsulate OTP API requests and responses (OTP API version 0.10+). Also included is a simple web client (`client/`) that shows how otp.js can be used to create a functional OTP front-end.

otp.js uses [Component](https://github.com/component/component) for dependency and build process management.

## Getting Started

To get started with otp.js and the sample web client:

1. Clone the otp.js repo to your local machine using `git clone https://github.com/conveyal/otp.js.git`

2. Install [npm](https://www.npmjs.org/) if needed. In the otp.js project directory, run `npm install` to install Component and set up the development environment (this in configured in package.json).

3. Run `make`, which invokes Component to download any required dependencies and package them together with the local otp.js code (a copy of the packaged code is put in `client/build/`).

4. Update the default configuration in `client/config.js` to point to your OTP backend.

5. Deploy the client to the web by copying the `client` directory to your web server.

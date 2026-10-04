### Start Stripe Terminal Quickstart with CLI

Source: https://docs.stripe.com/cli/license

The `terminal quickstart` command provides a rapid setup for Stripe Terminal, specifically for use with the Verifone P400 reader. It can optionally use a specific API key via the `--api-key` flag.

```bash
stripe terminal quickstart
```

--------------------------------

### Deprecated Two-Step Setup Intent Processing (Swift and Objective-C)

Source: https://docs.stripe.com/terminal/references/sdk-migration-guide

This example shows the older, two-step method for handling setup intents, which requires calling `collectSetupIntentPaymentMethod` followed by `confirmSetupIntent`. This pattern has been superseded by the `processSetupIntent` method.

```swift
// Step 1: Collect setup intent payment method
Terminal.shared.collectSetupIntentPaymentMethod(setupIntent, customerConsentCollected: true) { collectedSetupIntent, collectError in
    guard let collectedSetupIntent = collectedSetupIntent else {
        // Setup intent collection failed
        return
    }
    // Step 2: Confirm the setup intent
    Terminal.shared.confirmSetupIntent(collectedSetupIntent) { confirmedSetupIntent, confirmError in
        if let confirmedSetupIntent = confirmedSetupIntent {
            // Setup intent successful
        } else {
            // Setup intent confirmation failed
        }
    }
}
```

```objc
// Step 1: Collect setup intent payment method
[[SCPTerminal shared] collectSetupIntentPaymentMethod:setupIntent
                                customerConsentCollected:YES
                                              completion:^(SCPSetupIntent * _Nullable collectedSetupIntent, NSError * _Nullable collectError) {
    if (collectError) {
        // Setup intent collection failed
        return;
    }
    // Step 2: Confirm the setup intent
    [[SCPTerminal shared] confirmSetupIntent:collectedSetupIntent
                                  completion:^(SCPSetupIntent * _Nullable confirmedSetupIntent, NSError * _Nullable confirmError) {
        if (confirmedSetupIntent) {
            // Setup intent successful
        } else {
            // Setup intent confirmation failed
        }
    }];
}];
```

--------------------------------

### Build and run server-side applications for Stripe examples

Source: https://docs.stripe.com/connect/onboarding/quickstart

These commands provide instructions to build and run various Stripe sample server applications across multiple programming languages. Dependencies for each language are installed first, followed by commands to start the server, typically listening on port 4242 or 0.0.0.0.

```bash
pip3 install -r requirements.txt
FLASK_APP=server.py python3 -m flask run --port=4242
```

```bash
bundle install
ruby server.rb -o 0.0.0.0
```

```bash
composer install
php -S 127.0.0.1:4242 --docroot=dist
```

```bash
dotnet restore
dotnet run
```

```bash
mvn package
java -cp target/sample-jar-with-dependencies.jar com.stripe.sample.Server
```

```bash
go mod download github.com/stripe/stripe-go/v78
go mod download github.com/gorilla/mux
go run server.go
```

--------------------------------

### Build and run client-side applications using npm

Source: https://docs.stripe.com/connect/onboarding/quickstart

These commands demonstrate how to install dependencies and start client-side applications using npm. The standard commands `npm install` and `npm start` are used for some applications, while others might use `npm run dev` to launch the development server.

```bash
npm install
npm start
```

```bash
npm install
npm run dev
```

--------------------------------

### Install Stripe Server-Side Libraries

Source: https://docs.stripe.com/connect/end-to-end-marketplace

These code examples demonstrate how to install the official Stripe client libraries for server-side integration in Ruby and Python. This setup is essential for your backend to communicate securely with the Stripe API.

```ruby
# Available as a gem
sudo gem install stripe

# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

```python
# Install through pip
pip3 install --upgrade stripe

# Or find the Stripe package on http://pypi.python.org/pypi/stripe/

# Find the version you want to pin:
# https://github.com/stripe/stripe-python/blob/master/CHANGELOG.md
# Specify that version in your requirements.txt file
stripe>=5.0.0
```

--------------------------------

### Initialize and Open Account Onboarding Controller (Java)

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

This Java snippet demonstrates how to initialize an `AccountOnboardingController` using `EmbeddedComponentManager` within an Android `FragmentActivity`. It shows the setup in `onCreate` and how to trigger the onboarding flow by calling `show()` on the controller. This relies on a ViewModel to manage component instances.

```java
public class MyActivity extends FragmentActivity {
    private MyActivityViewModel viewModel;
    private AccountOnboardingController accountOnboardingController;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EmbeddedComponentManager.onActivityCreate(this);
        setContentView(R.layout.my_activity);

        viewModel =
            new ViewModelProvider(this).get(MyActivityViewModel.class);
        accountOnboardingController =
            viewModel.embeddedComponentManager.createAccountOnboardingController(this);
    }

    private void openAccountOnboarding() {
        accountOnboardingController.show();
    }
}
```

--------------------------------

### Install Stripe Go Library

Source: https://docs.stripe.com/billing/subscriptions/paypal

Instructions for installing the Stripe Go library. Ensure your project uses Go Modules and then use 'go get' to retrieve the package.

```bash
# Make sure your project is using Go Modules
go mod init
# Install stripe-go
go get -u github.com/stripe/stripe-go/v83
```

```go
// Then import the package
import (
  "github.com/stripe/stripe-go/v83"
)
```

--------------------------------

### Single-Step Setup Intent Processing with processSetupIntent (Swift and Objective-C)

Source: https://docs.stripe.com/terminal/references/sdk-migration-guide

This code demonstrates the modern, single-step approach to process setup intents using `processSetupIntent`. It also shows how to configure `allowRedisplay` for the setup intent collection, simplifying the previous two-step workflow.

```swift
// Configure with allowRedisplay
let config = try CollectSetupIntentConfigurationBuilder()
    .setAllowRedisplay(.always)
    .build()

// Process the setup intent in one step
Terminal.shared.processSetupIntent(setupIntent, collectConfig: config) { processedSetupIntent, setupError in
    if let processedSetupIntent = processedSetupIntent {
        // Setup intent successful
    } else {
        // Setup intent failed
    }
}
```

```objc
// Configure with allowRedisplay
NSError *error = nil;
SCPCollectSetupIntentConfiguration *config = [[[SCPCollectSetupIntentConfigurationBuilder new]
    setAllowRedisplay:SCPAllowRedisplayAlways]
    build:&error];

// Process the setup intent in one step
[[SCPTerminal shared] processSetupIntent:setupIntent
                           collectConfig:config
                              completion:^(SCPSetupIntent * _Nullable processedSetupIntent, NSError * _Nullable setupError) {
    if (processedSetupIntent) {
        // Setup intent successful
    } else {
        // Setup intent failed
    }
}];
```

--------------------------------

### Install Stripe Client for Go

Source: https://docs.stripe.com/payments/advanced/build-subscriptions

This snippet outlines the steps to install the 'stripe-go' package by initializing Go Modules and using 'go get', followed by how to import the package into your Go code.

```bash
go mod init
# Install stripe-go
go get -u github.com/stripe/stripe-go/v83
```

```go
import (
  "github.com/stripe/stripe-go/v83"
)
```

--------------------------------

### Set Up and Run Backend Servers for Stripe Integration

Source: https://docs.stripe.com/terminal/quickstart

Provides command-line instructions for setting up and running backend servers across various programming languages. Each example includes steps for installing dependencies and then starting the server, facilitating local development and testing of Stripe integrations.

```bash
npm install
```

```bash
npm start
```

```bash
go run server.go
```

```bash
pip3 install -r requirements.txt
```

```bash
export FLASK_APP="server.py" && python3 -m flask run --port=4242
```

```bash
bundle install
```

```bash
ruby server.rb
```

```bash
composer install
```

```bash
php -S 127.0.0.1:4242 --docroot=public
```

```bash
dotnet restore
```

```bash
dotnet run
```

```bash
mvn package
```

```bash
java -cp target/sample-jar-with-dependencies.jar com.stripe.sample.Server
```

--------------------------------

### Install Stripe Go library

Source: https://docs.stripe.com/billing/subscriptions/klarna

Set up the Stripe client library for Go projects. Ensure your project uses Go Modules, then use 'go get' to install the library and import it into your Go source files.

```bash
go mod init
go get -u github.com/stripe/stripe-go/v83
```

```go
import (
  "github.com/stripe/stripe-go/v83"
)
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/payments/3d-secure/authentication-flow

Creates a new Setup Intent, which guides you through the process of setting up a customer's payment method for future payments. This object tracks the setup process.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new Setup Intent, which guides you through the process of setting up a customer's payment method for future payments. This object tracks the setup process.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Request Body
- **customer** (string) - Required - The ID of the Customer this Setup Intent belongs to.
- **payment_method_options[card][request_three_d_secure]** (string) - Optional - Controls when to request 3D Secure verification. Valid values are "automatic" (default), "any", or "challenge_on_mandate".

### Request Example
```json
{
  "customer": "cus_xxxxxxxxxxxxxx",
  "payment_method_options": {
    "card": {
      "request_three_d_secure": "any"
    }
  }
}
```

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the Setup Intent.
- **customer** (string) - The ID of the customer associated with this Setup Intent.
- **status** (string) - The status of the Setup Intent.
- **client_secret** (string) - A client secret string for the Setup Intent.

#### Response Example
```json
{
  "id": "seti_1Ixxxxxxxxxxxxxx",
  "object": "setup_intent",
  "customer": "cus_xxxxxxxxxxxxxx",
  "usage": "off_session",
  "livemode": false,
  "status": "requires_payment_method",
  "client_secret": "seti_1Ixxxxxxxxxxxxxx_secret_xxxxxxxxxxxxx",
  "payment_method_options": {
    "card": {
      "request_three_d_secure": "any"
    }
  }
}
```
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/docs/api/subscriptions

Endpoints for managing SetupIntents, which guide you through the process of setting up and saving a customer's payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Request Body
- **customer** (string) - Optional - ID of the Customer this SetupIntent belongs to, if one exists.
- **payment_method_types** (array) - Required - The list of payment method types (e.g., card) that this SetupIntent is allowed to use.

### Request Example
```json
{
  "customer": "cus_123",
  "payment_method_types": ["card"]
}
```

### Response
#### Success Response (200)
- **id** (string) - The SetupIntent's ID.
- **status** (string) - The status of the SetupIntent.

#### Response Example
```json
{
  "id": "seti_123",
  "status": "requires_payment_method"
}
```

---

## GET /v1/setup_intents/:id

### Description
Retrieves a SetupIntent by its ID.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

### Response
#### Success Response (200)
- **id** (string) - The SetupIntent's ID.
- **status** (string) - The status of the SetupIntent.

#### Response Example
```json
{
  "id": "seti_123",
  "status": "requires_payment_method"
}
```

---

## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

### Response
#### Success Response (200)
- **id** (string) - The SetupIntent's ID.
- **status** (string) - The status of the SetupIntent.

#### Response Example
```json
{
  "id": "seti_123",
  "status": "succeeded"
}
```
```

--------------------------------

### Create an AccountSession on Server (Ruby)

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

Illustrates the initial setup for creating an AccountSession on a server using Ruby and Sinatra. This session is used to delegate API access to a connected account for Stripe Connect embedded components. The example shows how to require necessary libraries and a placeholder for the Stripe secret API key.

```ruby
require 'sinatra'
require 'stripe'
# This is a placeholder - it should be replaced with your secret API key.
# Sign in to see your own test API key embedded in code samples.
```

--------------------------------

### Install Connect.js and React Connect.js NPM Packages

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

This bash command installs both the `@stripe/connect-js` and `@stripe/react-connect-js` npm packages. These libraries are essential for developers building React applications that utilize Stripe's embedded Connect components.

```bash
npm install --save @stripe/connect-js @stripe/react-connect-js
```

--------------------------------

### Deprecated: Collect and Confirm Setup Intent in Kotlin with Stripe Terminal

Source: https://docs.stripe.com/terminal/references/sdk-migration-guide

This Kotlin example illustrates the deprecated two-step process for handling setup intents with Stripe Terminal. It involves collecting the setup intent payment method and then explicitly confirming it. This functionality is now streamlined into a single `processSetupIntent` method.

```kotlin
// Step 1: Collect setup intent payment method
Terminal.getInstance().collectSetupIntentPaymentMethod(
    intent = setupIntent,
    allowRedisplay = AllowRedisplay.ALWAYS,
    callback = object : SetupIntentCallback {
        override fun onSuccess(setupIntent: SetupIntent) {
            // Step 2: Confirm the setup intent
            Terminal.getInstance().confirmSetupIntent(setupIntent, object : SetupIntentCallback {
                override fun onSuccess(confirmedSetupIntent: SetupIntent) {
                    // Setup intent successful
                }
                override fun onFailure(e: TerminalException) {
                    // Setup intent confirmation failed
                }
            })
        }
        override fun onFailure(e: TerminalException) {
            // Setup intent collection failed
        }
    }
);
```

--------------------------------

### GET /callback/stripe (Successful Installation)

Source: https://docs.stripe.com/stripe-apps/install-links

Explains the parameters received by your application's callback URL after a user successfully installs your Stripe app. It also covers the verification process using `install_signature`.

```APIDOC
## GET /callback/stripe (Successful Installation)

### Description
This endpoint describes the parameters your application's backend receives via a GET request after a user successfully installs your Stripe app. It includes details about the installed account, the user, and a signature for verification.

### Method
GET

### Endpoint
/callback/stripe

### Parameters
#### Query Parameters
- **user_id** (string) - Required - The ID of the Stripe user that initiated the install.
- **account_id** (string) - Required - The ID of the Stripe account that installed your app.
- **state** (string) - Optional - The `state` value, if provided during the initial authorization request.
- **install_signature** (string) - Required - A hash of the above values generated using your app’s signing secret, used for verifying the authenticity of the installation.
- **livemode** (boolean) - Optional - Indicates if the app was installed into a test mode or sandbox environment (`false` for test/sandbox, `true` or absent for live mode).

### Request Example
```url
https://example.com/callback/stripe?user_id={USER_ID}&account_id={CONNECTED_ACCOUNT_ID}&state={STATE}&install_signature={INSTALL_SIGNATURE}
```
```url
https://example.com/callback/stripe?user_id={USER_ID}&account_id={CONNECTED_ACCOUNT_ID}&state={STATE}&install_signature={INSTALL_SIGNATURE}&livemode=false
```

### Response
#### Success Response (200)
Upon successful verification, your application should store the `account_id` and can then proceed with connecting to the user's Stripe account. The specific response to the user's browser is determined by your application, typically a success page or redirect.

#### Response Example
```json
{
  "success": true,
  "message": "Stripe app installed successfully."
}
```

### Signature Verification (Ruby Example)
To verify the `install_signature`, ensure the payload fields `{ state, user_id, account_id }` are ordered correctly before passing them to the verification function.

```ruby
get '/verify' do
  user_id = params[:user_id]
  account_id = params[:account_id]
  state = params[:state]
  install_signature = params[:install_signature]

  payload = JSON.dump({
    state: state,
    user_id: user_id,
    account_id: account_id
  })

  begin
    Stripe::Webhook::Signature.verify_header(
      payload,
      install_signature,
      'STRIPE_APP_SECRET'
    )
  rescue Stripe::SignatureVerificationError => e
    return e.message, 400
  end

  { success: true }.to_json
end
```
```

--------------------------------

### Initialize Go Modules and install Stripe Go library

Source: https://docs.stripe.com/payments/accept-a-payment

These commands initialize Go Modules for your project and then install the Stripe Go library. 'go mod init' sets up module management, and 'go get' fetches the specified version of the 'stripe-go' package, adding it to your 'go.mod' file.

```bash
go mod init
# Install stripe-go
go get -u github.com/stripe/stripe-go/v83
```

--------------------------------

### Build Server Dependencies for Stripe Examples

Source: https://docs.stripe.com/billing/quickstart

These commands illustrate how to install necessary dependencies for a server application in various programming environments. Each command corresponds to a specific language's package manager, preparing the project for execution by installing required libraries and modules.

```shell
pip3 install -r requirements.txt
```

```shell
bundle install
```

```shell
composer install
```

```shell
dotnet restore
```

```shell
mvn package
```

--------------------------------

### Install Stripe Go SDK and Import Package

Source: https://docs.stripe.com/payments/bancontact/accept-a-payment

This snippet demonstrates how to install the Stripe Go SDK using 'go get' and subsequently import the package into a Go application. It covers both the dependency management and the Go import statement for initial setup.

```bash
go get -u github.com/stripe/stripe-go/v83
```

```go
import (
  "github.com/stripe/stripe-go/v83"
)
```

--------------------------------

### Initialize Go Modules and install Stripe Go SDK

Source: https://docs.stripe.com/connect/end-to-end-saas-platform

These commands set up Go Modules for your project and then fetch the Stripe Go SDK. `go mod init` creates a `go.mod` file, and `go get -u` downloads and updates the specified Stripe package to its latest compatible version.

```bash
go mod init
go get -u github.com/stripe/stripe-go/v83
```

--------------------------------

### Install Stripe Go Library via go get

Source: https://docs.stripe.com/connect/connect-embedded-components/quickstart

This snippet demonstrates how to install the Stripe Go library using the 'go get' command. This command fetches and installs the specified module, integrating it into your Go project. Ensure Go Modules are initialized in your project before running this command.

```bash
go get -u github.com/stripe/stripe-go/v82@v82.4.0
```

--------------------------------

### Install Stripe API Libraries (Ruby & Python)

Source: https://docs.stripe.com/payments/accept-a-payment

These snippets provide commands for installing the official Stripe API client libraries for Ruby and Python. The Ruby examples show installation via `gem` and `bundler`, while the Python example uses `pip`.

```ruby
# Available as a gem
sudo gem install stripe

# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

```python
# Install through pip
pip3 install --upgrade stripe
```

--------------------------------

### Create Stripe SetupIntent and Get Client Secret (Multi-language)

Source: https://docs.stripe.com/billing/subscriptions/au-becs-debit

This code demonstrates how to create a Stripe SetupIntent on the server-side to initiate the setup of payment methods. It provides examples in PHP, Java, Node.js, Go, and .NET, all of which retrieve a `client_secret` that is subsequently passed to the client-side application for payment method collection. The examples are configured to use the `au_becs_debit` payment method type.

```php
require_once('vendor/autoload.php');

$setup_intent = \Stripe\SetupIntent::create([
  'payment_method_types' => ['au_becs_debit'],
]);
$client_secret = $setup_intent->client_secret
// Pass the client secret to the client
```

```java
import java.util.HashMap;
import java.util.Map;

import com.stripe.Stripe;
import com.stripe.model.SetupIntent;

public class StripeJavaQuickStart {
  public static void main(String[] args) {
    // Set your secret key. Remember to switch to your live secret key in production.
    // See your keys here: https://dashboard.stripe.com/apikeys
    Stripe.apiKey = "<<YOUR_SECRET_KEY>>";

    Map<String, Object> setupIntentParams = new HashMap<String, Object>();
    ArrayList paymentMethodTypes = new ArrayList();
    setupIntentParams.put("payment_method_types", Arrays.asList("au_becs_debit"));
    SetupIntent setupIntent = SetupIntent.create(setupIntentParams);
    String clientSecret = setupIntent.getClientSecret();
    // Pass the client secret to the client
  }
}
```

```javascript
// Using Express
const express = require('express');
const app = express();
app.use(express.json());
const { resolve } = require("path");

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntent = await stripe.setupIntents.create({
  payment_method_types: ['au_becs_debit'],
});
const clientSecret = setupIntent.client_secret;
// Pass the client secret to the client
```

```go
package main

import (
  "encoding/json"
  "log"
  "net/http"

  "github.com/stripe/stripe-go/v76.0.0"
  "github.com/stripe/stripe-go/v76.0.0/setupintent"
)

func main() {
  // Set your secret key. Remember to switch to your live secret key in production!
  // See your keys here: https://dashboard.stripe.com/apikeys
  stripe.Key = "<<YOUR_SECRET_KEY>>"

  setupIntentParams := &stripe.SetupIntentParams{
    PaymentMethodTypes: stripe.StringSlice([]string{
      "au_becs_debit",
    }),
  }
  setupIntent, err := setupintent.New(setupIntentParams)
  clientSecret := setupIntent.ClientSecret
  // Pass the client secret to the client
}
```

```csharp
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";

using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace StripeExampleApi.Controllers
{
    [Route("/wallet")]
    public class WalletController : Controller
    {
        public IActionResult Index()
        {
            var service = new SetupIntentService();
            var options = new SetupIntentCreateOptions
            {
              PaymentMethodTypes = new List<string>
              {
                "au_becs_debit",
              },
            };
            SetupIntent intent = service.Create(options);

            var clientSecret = setupIntent.ClientSecret;
            // Pass the client secret to the client
        }
    }
}
```

--------------------------------

### Install Stripe Connect Android SDK

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

These code examples demonstrate how to integrate the Stripe Connect Android SDK into your mobile application. By adding the `implementation("com.stripe:connect:22.0.0")` dependency, you can access Stripe's embedded components for Android. Both Kotlin DSL and Groovy DSL snippets are provided for adding this dependency to your `app/build.gradle` file.

```kotlin
plugins {
    id("com.android.application")
}

android { ... }

dependencies {
  // ...

  // Connect Android SDK
  implementation("com.stripe:connect:22.0.0")
}
```

```groovy
apply plugin: 'com.android.application'

android { ... }

dependencies {
  // ...

  // Connect Android SDK
  implementation 'com.stripe:connect:22.0.0'
}
```

--------------------------------

### Example Output for Stripe Product/Price Creation

Source: https://docs.stripe.com/development/quickstart

This snippet shows the expected console output after successfully running the Ruby script, providing the unique IDs for the newly created Stripe product and price.

```Command Line
Success! Here is your starter subscription product id: prod_0KxBDl589O8KAxCG1alJgiA6
Success! Here is your starter subscription price id: price_0KxBDm589O8KAxCGMgG7scjb
```

--------------------------------

### Setup Attempts API

Source: https://docs.stripe.com/docs/api/subscriptions

Endpoints for retrieving setup attempts, which describe one attempted confirmation of a SetupIntent.

```APIDOC
## GET /v1/setup_attempts

### Description
Lists all setup attempts.

### Method
GET

### Endpoint
/v1/setup_attempts

### Parameters
#### Query Parameters
- **setup_intent** (string) - Optional - The ID of the SetupIntent whose SetupAttempts will be retrieved.
- **limit** (integer) - Optional - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.

### Response
#### Success Response (200)
- **data** (array) - An array of setup attempt objects.

#### Response Example
```json
{
  "data": [
    {
      "id": "setatt_123",
      "setup_intent": "seti_123"
    }
  ]
}
```
```

--------------------------------

### Install Stripe Go Library

Source: https://docs.stripe.com/apple-pay

Initialize Go Modules if your project doesn't have them, then use 'go get' to install the Stripe Go library. After installation, import the package in your Go code to use it.

```bash
go mod init
go get -u github.com/stripe/stripe-go/v83
```

```go
import (
  "github.com/stripe/stripe-go/v83"
)
```

--------------------------------

### Install Client Application Dependencies with npm

Source: https://docs.stripe.com/checkout/quickstart

This command installs all required client-side dependencies for the application using npm. It should be run in the client project's root directory before starting the application.

```shell
npm install
```

--------------------------------

### Create Stripe SetupIntent with Automatic Payment Methods (Go, .NET)

Source: https://docs.stripe.com/payments/finalize-payments-on-the-server-legacy

These code examples demonstrate how to create a Stripe SetupIntent on the server-side, enabling the collection and setup of payment methods for future use. The examples show how to configure automatic payment methods, handle customer acceptance for mandates, and confirm the intent. Dependencies include the Stripe Go library and Stripe .NET library. It takes a payment method ID and returns the client secret for the SetupIntent.

```go
package main

import (
  "encoding/json"
  "net/http"

  "github.com/stripe/stripe-go/v76.0.0"
  "github.com/stripe/stripe-go/v76.0.0/setupintent"
)

type CheckoutData struct {
  ClientSecret string `json:"client_secret"`
}

func main() {
  stripe.Key = "<<YOUR_SECRET_KEY>>"

  http.HandleFunc("/create-intent", func(w http.ResponseWriter, r *http.Request) {
    var req struct {
      PaymentMethodID string `json:"payment_method_id"`
      ShouldSavePaymentMethod bool `json:"should_save_payment_method"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      // log.Printf("json.NewDecoder.Decode: %v", err) // log not defined
      return
    }
    params := &stripe.SetupIntentParams{
      Customer: stripe.String("c.ID"), // Placeholder for Customer ID
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      AutomaticPaymentMethods: &stripe.SetupIntentAutomaticPaymentMethodsParams{
        Enabled: stripe.Bool(true),
      },
      Confirm: stripe.Bool(true),
      PaymentMethod: stripe.String(req.PaymentMethodID), // the PaymentMethod ID sent by your client
      ReturnURL: stripe.String(string("your-app://stripe-redirect")),
      MandateData: &stripe.SetupIntentMandateDataParams{
        CustomerAcceptance: &stripe.SetupIntentMandateDataCustomerAcceptanceParams{
          Type: stripe.String("online"),
          Online: &stripe.SetupIntentMandateDataCustomerAcceptanceOnlineParams{
            IPAddress: stripe.String("/* your client's IP address */"),
            UserAgent: stripe.String(r.UserAgent()),
          },
        },
      },
    }
    intent, err := setupintent.New(params);
    if err == nil {
      w.Header().Set("Content-Type", "application/json")
      w.WriteHeader(http.StatusOK)
      data := CheckoutData{
        ClientSecret: intent.ClientSecret,
      }
      json.NewEncoder(w).Encode(data)
    } else {
      if stripeErr, ok := err.(*stripe.Error); ok {
        switch stripeErr.Type {
          case stripe.ErrorTypeCard:
            http.Error(w, stripeErr.Msg, http.StatusInternalServerError)
          default:
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
      } else {
        http.Error(w, err.Error(), http.StatusInternalServerError)
      }
    }
  })

  http.ListenAndServe(":4242", nil)
}
```

```csharp
using System;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Newtonsoft.Json; // Assuming Newtonsoft.Json for JsonProperty

namespace StripeExampleApi.Controllers
{
  [Route("create-intent")]
  [ApiController]
  public class CheckoutApiController : Controller
  {
    public CheckoutApiController()
    {
      StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";
    }

    [HttpPost]
    public ActionResult Post([FromBody]IntentCreateRequest request)
    {
      var options = new SetupIntentCreateOptions()
      {
        Customer = "customer.Id", // Placeholder for Customer ID
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        AutomaticPaymentMethods = new SetupIntentAutomaticPaymentMethodsOptions
        {
          Enabled = true,
        },
        Confirm = true,
        PaymentMethod = request.PaymentMethodId,
        ReturnUrl = "your-app://stripe-redirect",
        MandateData = new SetupIntentMandateDataOptions // Corrected from PaymentIntentMandateDataOptions
        {
          CustomerAcceptance = new SetupIntentMandateDataCustomerAcceptanceOptions // Corrected from PaymentIntentMandateDataCustomerAcceptanceOptions
          {
            Type = "online",
            Online = new SetupIntentMandateDataCustomerAcceptanceOnlineOptions // Corrected from PaymentIntentMandateDataCustomerAcceptanceOnlineOptions
            {
              IpAddress = "/* The client's IP address*/",
              UserAgent = Request.Headers["User-Agent"].ToString()
            }
          },
        },
      };
      var service = new SetupIntentService();
      try
      {
        SetupIntent intent = service.Create(options);
        return Json(new { client_secret = intent.ClientSecret });
      }
      catch (StripeException e)
      {
        this.HttpContext.Response.StatusCode = 400;
        switch (e.StripeError.Type)
        {
          case "card_error":
            return Json(new { error = e.Message });
          default:
            return Json(new { error = e.Message });
        }
      }
    }

    public class IntentCreateRequest
    {
      [JsonProperty("payment_method_id")]
      public string PaymentMethodId { get; set; }
      [JsonProperty("should_save_payment_method")]
      public bool ShouldSavePaymentMethod { get; set; }
    }
  }
}
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/terminal/configuration/update_api-version=2025-01-27

Lists all SetupIntents, which guide you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
{}

### Response
#### Success Response (200)
None provided.

#### Response Example
{}
```

--------------------------------

### Initialize Stripe Go SDK

Source: https://docs.stripe.com/sdks/server-side

Example of initializing the Stripe Go SDK by importing the package and setting the global API key for authentication.

```go
import ("github.com/stripe/stripe-go/v83")
stripe.Key = "<<YOUR_SECRET_KEY>>"
```

--------------------------------

### Customize Embedded Component Appearance and Fonts at Initialization (Kotlin)

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components_platform=android

This Kotlin example demonstrates how to initialize the `EmbeddedComponentManager` with custom fonts and appearance settings. It defines a `CustomFontSource` for a `.ttf` font file located in the `assets/` folder and configures typography (font family, size) and primary colors using `Appearance.Builder` and `Colors.Builder`. This setup applies the specified styles upon component creation.

```Kotlin
// Specify custom fonts
val customFonts = listOf(
    CustomFontSource(
        // Font file located in `assets/` folder
        assetsFilePath = "fonts/myCustomFont.ttf",
        name = "myCustomFont",
        weight = 1000,
    )
)

// Customize appearance
val appearance = Appearance.Builder()
    .typography(
        Typography.Builder()
            .fontFamily("myCustomFont") // Same name as the custom font above
            .fontSizeBase(16f) // Unscaled font size
            .build()
    )
    .colors(
        Colors.Builder()
            .primary(Color.RED)
            .build()
    )
    .build()

val embeddedComponentManager = EmbeddedComponentManager(
    publishableKey = 
"pk_test_TYooMQauvdEDq54NiTphI7jx"
,
    fetchClientSecret = ::fetchClientSecret,
    appearance = appearance,
    customFonts = customFonts,
)
```

--------------------------------

### Build and Run Node.js Client Application with npm

Source: https://docs.stripe.com/connect/connect-embedded-components/quickstart

General commands for setting up and running a Node.js client application. This includes installing dependencies using `npm install` and starting the application via `npm start`, typically launching a development server.

```shell
npm install
```

```shell
npm start
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/payment-link/create_api-version=2024-10-28

Lists all SetupIntents, allowing you to review past setup processes.

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntents, allowing you to review past setup processes.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Create a Stripe SetupIntent (C#)

Source: https://docs.stripe.com/billing/subscriptions/stablecoins

This C# snippet demonstrates how to instantiate a Stripe client and create a SetupIntent resource. It shows the configuration of device-related options within the SetupIntent parameters, such as IP address and user agent, to prepare for setting up a payment method. The `SetupIntent` object returned includes details like a payment method ID and a redirect URL for customer interaction.

```csharp
                IpAddress = "127.0.0.0",
                UserAgent = "device",
            },
        },
    },
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options);
```

--------------------------------

### Create Stripe Setup Intent with US Bank Account details (Go, C#)

Source: https://docs.stripe.com/payments/ach-direct-debit/migrating-from-another-processor

This code demonstrates how to create a Stripe Setup Intent configured with US bank account details, billing information, and mandate data. It initializes the Setup Intent with the necessary payment method options and data, including account and routing numbers, and specifies customer acceptance terms for future payments. The Go example uses `params.AddExtra` for some fields, while the C# example uses strongly-typed options.

```go
USBankAccount: &stripe.SetupIntentCreatePaymentMethodOptionsUSBankAccountParams{},
  },
  PaymentMethodData: &stripe.SetupIntentCreatePaymentMethodDataParams{
    BillingDetails: &stripe.SetupIntentCreatePaymentMethodDataBillingDetailsParams{},
    USBankAccount: &stripe.SetupIntentCreatePaymentMethodDataUSBankAccountParams{
      RoutingNumber: stripe.String("{{ROUTING_NUMBER}}"),
      AccountNumber: stripe.String("{{ACCOUNT_NUMBER}}"),
      AccountHolderType: stripe.String("individual"),
    },
  },
  MandateData: &stripe.SetupIntentCreateMandateDataParams{
    CustomerAcceptance: &stripe.SetupIntentCreateMandateDataCustomerAcceptanceParams{
      Type: stripe.String("offline"),
      AcceptedAt: stripe.Int64(1692821946),
    },
  },
}
params.AddExtra("payment_method_options[us_bank_account][verification_method]", "skip")
params.AddExtra("payment_method_data[type]", "us_bank_account")
params.AddExtra("payment_method_data[billing_details][name]", "{{ACCOUNT_HOLDER_NAME}}")
result, err := sc.V1SetupIntents.Create(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SetupIntentCreateOptions
{
    PaymentMethodTypes = new List<string> { "us_bank_account" },
    Customer = "{{CUSTOMER_ID}}",
    Confirm = true,
    PaymentMethodOptions = new SetupIntentPaymentMethodOptionsOptions
    {
        UsBankAccount = new SetupIntentPaymentMethodOptionsUsBankAccountOptions
        {
            VerificationMethod = "skip",
        },
    },
    PaymentMethodData = new SetupIntentPaymentMethodDataOptions
    {
        Type = "us_bank_account",
        BillingDetails = new SetupIntentPaymentMethodDataBillingDetailsOptions
        {
            Name = "{{ACCOUNT_HOLDER_NAME}}",
        },
        UsBankAccount = new SetupIntentPaymentMethodDataUsBankAccountOptions
        {
            RoutingNumber = "{{ROUTING_NUMBER}}",
            AccountNumber = "{{ACCOUNT_NUMBER}}",
            AccountHolderType = "individual",
        },
    },
    MandateData = new SetupIntentMandateDataOptions
    {
        CustomerAcceptance = new SetupIntentMandateDataCustomerAcceptanceOptions
        {
            Type = "offline",
            AcceptedAt = DateTimeOffset.FromUnixTimeSeconds(1692821946).UtcDateTime,
        },
    },
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options);
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/treasury/received_debits/object_api-version=2024-09-30

A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No specific path parameters detailed in the provided text.

#### Query Parameters
- No specific query parameters detailed in the provided text.

#### Request Body
- No specific request body fields detailed in the provided text.

### Request Example
{}

### Response
#### Success Response (200)
- Response details not provided in the input text.

#### Response Example
{
  "example": "response body details not provided"
}
```

--------------------------------

### Configure Stripe SDK Publishable Key on App Start

Source: https://docs.stripe.com/payments/eps/accept-a-payment

These examples demonstrate how to configure the Stripe SDK with your publishable key when the application launches. This setup is crucial for enabling your app to make secure requests to the Stripe API and should be performed once during app initialization.

```swift
import UIKit
import StripePaymentsUI

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {StripeAPI.defaultPublishableKey = "<<YOUR_PUBLISHABLE_KEY>>"
        // do any other necessary launch configuration
        return true
    }
}
```

```objc
#import "AppDelegate.h"
@import StripeCore;

@implementation AppDelegate
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {[StripeAPI setDefaultPublishableKey:@"<<YOUR_PUBLISHABLE_KEY>>"];
    // do any other necessary launch configuration
    return YES;
}
@end
```

--------------------------------

### Stripe Development Setup with CLI for Webhooks

Source: https://docs.stripe.com/checkout/quickstart

This set of commands outlines the development setup process, including installing client dependencies, configuring the Stripe CLI to forward webhooks to your local application, and running the development server with the webhook secret.

```shell
$ npm install
$ stripe listen --forward-to localhost:3000/api/webhooks
$ STRIPE_WEBHOOK_SECRET=$(stripe listen --print-secret) npm run dev
```

--------------------------------

### GET /callback/stripe (Failed Installation)

Source: https://docs.stripe.com/stripe-apps/install-links

Details the parameters received by your application's callback URL when a user cancels or declines the Stripe app installation.

```APIDOC
## GET /callback/stripe (Failed Installation)

### Description
This endpoint describes the parameters your application's backend receives via a GET request when a user cancels the Stripe app installation or access is denied.

### Method
GET

### Endpoint
/callback/stripe

### Parameters
#### Query Parameters
- **error** (string) - Required - An error code indicating the reason for failure (e.g., `access_denied`).
- **error_description** (string) - Required - A human-readable description of the error (e.g., "The user denied your request").

### Request Example
```url
https://example.com/callback/stripe?error=access_denied&error_description=The%20user%20denied%20your%20request
```

### Response
#### Error Response (200 - redirect contains error)
Your application should process these parameters to inform the user about the cancellation or denied access, typically by displaying an error message or redirecting to a relevant page.

#### Response Example
```json
{
  "success": false,
  "error": "access_denied",
  "message": "The user denied your request."
}
```
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/payment_methods/object_api-version=2024-09-30

A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

```

--------------------------------

### Stripe Terminal: Process Setup Intent in One Step (Kotlin & Java)

Source: https://docs.stripe.com/terminal/references/sdk-migration-guide

This snippet illustrates the simplified, single-step `processSetupIntent` method introduced in the Stripe Terminal SDK. It allows configuring `AllowRedisplay` and handles the entire setup intent lifecycle with a single callback, reducing boilerplate compared to the two-step approach.

```kotlin
// Configure with allowRedisplay
val config = CollectSetupIntentConfiguration.Builder()
    .build()

// Process the setup intent in one step
Terminal.getInstance().processSetupIntent(
    intent = setupIntent,
    allowRedisplay = AllowRedisplay.ALWAYS,
    collectConfig = config,
    callback = object : SetupIntentCallback {
        override fun onSuccess(setupIntent: SetupIntent) {
            // Setup intent successful
        }
        override fun onFailure(e: TerminalException) {
            // Setup intent failed
        }
    }
)
```

```java
// Configure with allowRedisplay
CollectSetupIntentConfiguration config = new CollectSetupIntentConfiguration.Builder()
    .build();

// Process the setup intent in one step
Terminal.getInstance().processSetupIntent(
    setupIntent,
    AllowRedisplay.ALWAYS,
    config,
    new SetupIntentCallback() {
        @Override
        public void onSuccess(@NotNull SetupIntent setupIntent) {
            // Setup intent successful
        }
        @Override
        public void onFailure(@NotNull TerminalException e) {
            // Setup intent failed
        }
    }
);
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/prices/object_api-version=2025-02-24

Lists all SetupIntents, which guide you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow. Create a SetupIntent when you’re ready to collect your customer’s payment credentials. Don’t maintain long-lived, unconfirmed SetupIntents because they might not be valid. The SetupIntent transitions through multiple statuses as it guides you through the setup process. Successful SetupIntents result in payment credentials that are optimized for future payments. For example, cardholders in certain regions might need to be run through Strong Customer Authentication during payment method collection to streamline later off-session payments. If you use the SetupIntent with a Customer, it automatically attaches the resulting payment method to that Customer after successful setup. We recommend using SetupIntents or setup_future_usage on PaymentIntents to save payment methods to prevent saving invalid or unoptimized payment methods. By using SetupIntents, you can reduce friction for your customers, even as regulations change over time.

### Method
GET

### Endpoint
/v1/setup_intents
```

--------------------------------

### Confirm Stripe SetupIntent with Revolut Pay (Client-side Kotlin/Java)

Source: https://docs.stripe.com/payments/revolut-pay/set-up-future-payments

This code demonstrates how to initialize the Stripe PaymentLauncher and confirm a SetupIntent using Revolut Pay payment parameters on the client-side. It shows the setup process in both Kotlin and Java, including how to retrieve the client secret and handle the payment result callback.

```kotlin
class RevolutPaySetupActivity : AppCompatActivity() {

    // ...

    private val paymentLauncher: PaymentLauncher by lazy {
        val paymentConfiguration = PaymentConfiguration.getInstance(applicationContext)
        PaymentLauncher.create(
            activity = this,
            publishableKey = paymentConfiguration.publishableKey,
            stripeAccountId = paymentConfiguration.stripeAccountId,
            callback = ::onPaymentResult,
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // …
        startCheckout()
    }

    private fun startCheckout() {
        // Create a SetupIntent on your backend and return the client_secret here
        val setupIntentClientSecret = // …

        val revolutPayParams = PaymentMethodCreateParams.createRevolutPay()

        val confirmParams = ConfirmSetupIntentParams.create(
            paymentMethodCreateParams = revolutPayParams,
            clientSecret = setupIntentClientSecret,
            // Add a mandate ID or MandateDataParams…
        )

        paymentLauncher.confirm(confirmParams)
    }

    private fun onPaymentResult(paymentResult: PaymentResult) {
        // Handle the setup result…
    }
}
```

```java
public class CheckoutActivity extends AppCompatActivity {

    // ...
    private PaymentLauncher paymentLauncher;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        // ...
        final PaymentConfiguration paymentConfiguration = PaymentConfiguration.getInstance(context);

        paymentLauncher = PaymentLauncher.create(
            this,
            paymentConfiguration.getPublishableKey(),
            paymentConfiguration.getStripeAccountId(),
            this::onPaymentResult
        );

        createSetupIntent();
    }

    private void createSetupIntent() {
        // Create a SetupIntent on your backend and return the client_secret here.
        String setupIntentClientSecret = // …

        PaymentMethodCreateParams revolutPayParams = PaymentMethodCreateParams.creatRevolutPay();

        ConfirmSetupIntentParams createParams = ConfirmSetupIntentParams.create(
            revolutPayParams,
            setupIntentClientSecret
            // Add a mandate ID or MandateDataParams…
        );

        paymentLauncher.confirm(confirmParams);
    }

    // ...

    private void onPaymentResult(PaymentResult paymentResult) {
        // Handle the payment result…
    }
}
```

--------------------------------

### Retrieve Stripe Setup Intent to Get Payment Method ID (Server-side)

Source: https://docs.stripe.com/payments/ideal/set-up-payment

These server-side examples show how to retrieve a Stripe Setup Intent to find the ID of a SEPA Direct Debit payment method. It demonstrates using 'curl' and 'stripe cli' commands to fetch the Setup Intent and expand the 'latest_attempt' field to access 'generated_sepa_debit' details. This is useful for charging customers again with the stored payment method.

```curl
curl -G https://api.stripe.com/v1/setup_intents/{{SETUP_INTENT_ID}} \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "expand[]"=latest_attempt
```

```cli
stripe setup_intents retrieve {{SETUP_INTENT_ID}} \
  -d "expand[0]"=latest_attempt
```

--------------------------------

### Install Stripe Connect SDK for Android

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components_platform=android

To integrate Stripe Connect embedded components into an Android application, add the `com.stripe:connect` dependency to the `dependencies` block of your `app/build.gradle.kts` file. This dependency provides access to the necessary SDK classes and functionalities for embedded components.

```Kotlin
plugins {
    id("com.android.application")
}

android { ... }

dependencies {
  // ...

  // Connect Android SDK
  implementation("com.stripe:connect:22.0.0")
}
```

--------------------------------

### GET /v1/setup_intents/:id

Source: https://docs.stripe.com/api/treasury/received_debits/object_api-version=2024-09-30

A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

```APIDOC
## GET /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
- No specific query parameters detailed in the provided text.

#### Request Body
- No specific request body fields detailed in the provided text.

### Request Example
{}

### Response
#### Success Response (200)
- Response details not provided in the input text.

#### Response Example
{
  "example": "response body details not provided"
}
```

--------------------------------

### Create Stripe Checkout Session in Setup Mode for Payment Method Collection

Source: https://docs.stripe.com/payments/checkout/migration

These examples demonstrate how to programmatically create a Stripe Checkout Session configured for 'setup' mode across various programming languages. This session type is specifically designed to collect and save a customer's payment method details for future use, rather than processing an immediate payment. The customer will be redirected to a Stripe-hosted page to complete the setup process, and upon success, will be redirected back to the `success_url`.

```python
session = client.v1.checkout.sessions.create({
  "mode": "setup",
  "currency": "usd",
  "success_url": "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
})
```

```php
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$session = $stripe->checkout->sessions->create([
  'mode' => 'setup',
  'currency' => 'usd',
  'success_url' => 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
]);
```

```java
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SessionCreateParams params =
  SessionCreateParams.builder()
    .setMode(SessionCreateParams.Mode.SETUP)
    .setCurrency("usd")
    .setSuccessUrl("https://example.com/success?session_id={CHECKOUT_SESSION_ID}")
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
Session session = client.v1().checkout().sessions().create(params);
```

```node
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const session = await stripe.checkout.sessions.create({
  mode: 'setup',
  currency: 'usd',
  success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
});
```

```go
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.CheckoutSessionCreateParams{
  Mode: stripe.String(stripe.CheckoutSessionModeSetup),
  Currency: stripe.String(stripe.CurrencyUSD),
  SuccessURL: stripe.String("https://example.com/success?session_id={CHECKOUT_SESSION_ID}"),
}
result, err := sc.V1CheckoutSessions.Create(context.TODO(), params)
```

```dotnet
var options = new Stripe.Checkout.SessionCreateOptions
{
    Mode = "setup",
    Currency = "usd",
    SuccessUrl = "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Checkout.Sessions;
Stripe.Checkout.Session session = service.Create(options);
```

--------------------------------

### Check RubyGems Installation and Version

Source: https://docs.stripe.com/development/quickstart

Executes a command to verify if RubyGems is installed and to display its current version. If RubyGems is not found, it advises downloading it from the official downloads page.

```Command Line
gem --version
```

--------------------------------

### Create a Product using Stripe CLI

Source: https://docs.stripe.com/development/quickstart

Uses the Stripe CLI to create a new product with a specified name and description. The 'id' from the response is crucial for subsequent API calls, such as creating prices.

```Command Line
stripe products create \
--name="My First Product" \
--description="Created with the Stripe CLI"
```

--------------------------------

### Next.js Development Setup with Stripe Webhooks

Source: https://docs.stripe.com/checkout/embedded/quickstart

Comprehensive commands for setting up a Next.js development environment with Stripe webhook integration. It involves installing dependencies, forwarding Stripe webhooks locally via the Stripe CLI, and starting the development server with the webhook secret injected.

```bash
npm install
```

```bash
stripe listen --forward-to localhost:3000/api/webhooks
```

```bash
STRIPE_WEBHOOK_SECRET=$(stripe listen --print-secret) npm run dev
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/issuing/physical_bundles_api-version=2025-09-30

A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent to guide through the process of setting up and saving a customer's payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
None

#### Query Parameters
Not specified in the provided text.

#### Request Body
Not specified in the provided text.

### Request Example
{}

### Response
#### Success Response (200)
Not specified in the provided text.

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates a specific SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters
Not specified in the provided text.

#### Request Body
Not specified in the provided text.

### Request Example
{}

### Response
#### Success Response (200)
Not specified in the provided text.

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves the details of a specific SetupIntent.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
Not specified in the provided text.

#### Request Body
None

### Request Example
{}

### Response
#### Success Response (200)
Not specified in the provided text.

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
None

#### Query Parameters
Not specified in the provided text.

#### Request Body
None

### Request Example
{}

### Response
#### Success Response (200)
Not specified in the provided text.

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a specific SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters
Not specified in the provided text.

#### Request Body
Not specified in the provided text.

### Request Example
{}

### Response
#### Success Response (200)
Not specified in the provided text.

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a specific SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters
Not specified in the provided text.

#### Request Body
Not specified in the provided text.

### Request Example
{}

### Response
#### Success Response (200)
Not specified in the provided text.

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies microdeposits for a specific SetupIntent, typically for bank account verification.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent.

#### Query Parameters
Not specified in the provided text.

#### Request Body
Not specified in the provided text.

### Request Example
{}

### Response
#### Success Response (200)
Not specified in the provided text.

#### Response Example
{}
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/accounts/object_api-version=2025-10-29

API endpoints for managing Setup Intents, which guide you through setting up and saving customer payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to verify microdeposits for.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Install Stripe .NET Library

Source: https://docs.stripe.com/billing/subscriptions/paypal

Instructions for installing the Stripe .NET library. You can install it using the dotnet CLI with 'dotnet add package' or via NuGet Package Manager with 'Install-Package'.

```bash
# Install with dotnet
dotnet add package Stripe.net
dotnet restore
```

```bash
# Or install with NuGet
Install-Package Stripe.net
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/customers/create_api-version=2025-04-30

Lists all SetupIntents.

```APIDOC
## GET /v1/setup_intents

### Description
Returns a list of all SetupIntents. The objects are returned in reverse chronological order by creation date.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- None provided in the input text.

#### Query Parameters
- None provided in the input text.

#### Request Body
- None provided in the input text.

### Request Example
{}

### Response
#### Success Response (200)
- None provided in the input text.

#### Response Example
{}
```

--------------------------------

### Confirm a Stripe Setup Intent with a Payment Method

Source: https://docs.stripe.com/api/setup_intents/confirm

This set of examples demonstrates how to confirm a Stripe Setup Intent, associating it with a specified payment method. This action is crucial for setting up future payments without immediate charges. The examples cover various programming languages and the command line, requiring a secret API key and a Setup Intent ID.

```curl
curl https://api.stripe.com/v1/setup_intents/seti_1Mm2cBLkdIwHu7ixaiKW3ElR/confirm \
  -u "<<YOUR_SECRET_KEY>>" \
  -d payment_method=pm_card_visa
```

```cli
stripe setup_intents confirm seti_1Mm2cBLkdIwHu7ixaiKW3ElR \
  --payment-method=pm_card_visa
```

```ruby
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.confirm(
  'seti_1Mm2cBLkdIwHu7ixaiKW3ElR',
  {payment_method: 'pm_card_visa'},
)
```

```python
client = StripeClient("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.confirm(
  "seti_1Mm2cBLkdIwHu7ixaiKW3ElR",
  {"payment_method": "pm_card_visa"},
)
```

```php
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$setupIntent = $stripe->setupIntents->confirm(
  'seti_1Mm2cBLkdIwHu7ixaiKW3ElR',
  ['payment_method' => 'pm_card_visa']
);
```

```java
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SetupIntentConfirmParams params =
  SetupIntentConfirmParams.builder().setPaymentMethod("pm_card_visa").build();

SetupIntent setupIntent =
  client.v1().setupIntents().confirm("seti_1Mm2cBLkdIwHu7ixaiKW3ElR", params);
```

```node
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntent = await stripe.setupIntents.confirm(
  'seti_1Mm2cBLkdIwHu7ixaiKW3ElR',
  {
    payment_method: 'pm_card_visa',
  }
);
```

```go
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SetupIntentConfirmParams{
  PaymentMethod: stripe.String("pm_card_visa"),
  Intent: stripe.String("seti_1Mm2cBLkdIwHu7ixaiKW3ElR"),
}
result, err := sc.V1SetupIntents.Confirm(context.TODO(), params)
```

```dotnet
var options = new SetupIntentConfirmOptions { PaymentMethod = "pm_card_visa" };
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Confirm("seti_1Mm2cBLkdIwHu7ixaiKW3ElR", options);
```

--------------------------------

### Install Stripe Go SDK

Source: https://docs.stripe.com/connect/separate-charges-and-transfers

These commands ensure your Go project is set up with Go Modules and then installs the 'stripe-go' package. 'go mod init' initializes the module, and 'go get' fetches the Stripe SDK.

```bash
# Make sure your project is using Go Modules
go mod init
```

```bash
# Install stripe-go
go get -u github.com/stripe/stripe-go/v83
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/customer_portal/configurations/update_api-version=2025-10-29

A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

```APIDOC
## POST /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. Create a SetupIntent when you’re ready to collect your customer’s payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- Not provided in the current documentation

#### Query Parameters
- Not provided in the current documentation

#### Request Body
- Not provided in the current documentation

### Request Example
{
  "example": "Not provided in the current documentation"
}

### Response
#### Success Response (200)
- Not provided in the current documentation

#### Response Example
{
  "example": "Not provided in the current documentation"
}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. Create a SetupIntent when you’re ready to collect your customer’s payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters
- Not provided in the current documentation

#### Request Body
- Not provided in the current documentation

### Request Example
{
  "example": "Not provided in the current documentation"
}

### Response
#### Success Response (200)
- Not provided in the current documentation

#### Response Example
{
  "example": "Not provided in the current documentation"
}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. Retrieve a specific SetupIntent by its ID.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
- Not provided in the current documentation

#### Request Body
- Not provided in the current documentation

### Request Example
{
  "example": "Not provided in the current documentation"
}

### Response
#### Success Response (200)
- Not provided in the current documentation

#### Response Example
{
  "example": "Not provided in the current documentation"
}
```

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. List all SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- Not provided in the current documentation

#### Query Parameters
- Not provided in the current documentation

#### Request Body
- Not provided in the current documentation

### Request Example
{
  "example": "Not provided in the current documentation"
}

### Response
#### Success Response (200)
- Not provided in the current documentation

#### Response Example
{
  "example": "Not provided in the current documentation"
}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancel a SetupIntent. Don’t maintain long-lived, unconfirmed SetupIntents because they might not be valid.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters
- Not provided in the current documentation

#### Request Body
- Not provided in the current documentation

### Request Example
{
  "example": "Not provided in the current documentation"
}

### Response
#### Success Response (200)
- Not provided in the current documentation

#### Response Example
{
  "example": "Not provided in the current documentation"
}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirm a SetupIntent to finalize the setup of payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters
- Not provided in the current documentation

#### Request Body
- Not provided in the current documentation

### Request Example
{
  "example": "Not provided in the current documentation"
}

### Response
#### Success Response (200)
- Not provided in the current documentation

#### Response Example
{
  "example": "Not provided in the current documentation"
}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verify microdeposits for a SetupIntent, typically used for bank account verification.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent for which to verify microdeposits.

#### Query Parameters
- Not provided in the current documentation

#### Request Body
- Not provided in the current documentation

### Request Example
{
  "example": "Not provided in the current documentation"
}

### Response
#### Success Response (200)
- Not provided in the current documentation

#### Response Example
{
  "example": "Not provided in the current documentation"
}
```

--------------------------------

### Initialize Stripe Ruby SDK

Source: https://docs.stripe.com/sdks/server-side

Example of initializing the Stripe Ruby SDK by requiring the library and setting the API key for authentication.

```ruby
require 'stripe'
Stripe.api_key = '<<YOUR_SECRET_KEY>>'
```

--------------------------------

### GET /v1/setup_intents/:id

Source: https://docs.stripe.com/api/payment_methods/object_api-version=2024-09-30

A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

```APIDOC
## GET /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - Unique identifier for the SetupIntent.

#### Query Parameters

#### Request Body

```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/payments/acss-debit/set-up-payment

Retrieve a list of Setup Intents associated with a specific customer. This allows you to view all payment method setup attempts for a given customer.

```APIDOC
## GET /v1/setup_intents

### Description
Retrieve a list of Setup Intents associated with a specific customer. This allows you to view all payment method setup attempts for a given customer.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
No path parameters.

#### Query Parameters
- **customer** (string) - Required - The ID of the customer whose Setup Intents you want to retrieve.

#### Request Body
No request body.

### Request Example
N/A (Query parameters in URL)

### Response
#### Success Response (200)
A Stripe `StripeList` object containing a list of `SetupIntent` objects.

- **data** (array) - List of SetupIntent objects.
- **has_more** (boolean) - True if there are more elements available.
- **object** (string) - Value is `list`.
- **url** (string) - The URL for the list endpoint.

#### Response Example
```json
{
  "object": "list",
  "data": [
    {
      "id": "seti_123abc",
      "object": "setup_intent",
      "customer": "cus_xyz123",
      "status": "succeeded",
      "usage": "off_session",
      "livemode": false,
      "metadata": {}
    }
  ],
  "has_more": false,
  "url": "/v1/setup_intents"
}
```
```

--------------------------------

### Create Stripe SetupIntent (Go, .NET)

Source: https://docs.stripe.com/payments/mobile/finalize-payments-on-the-server

These examples show server-side implementation for creating a Stripe SetupIntent. They handle incoming payment method IDs, configure automatic payment methods, mandate data for customer acceptance, and return the client secret upon success. Error handling for Stripe-specific exceptions is also included.

```go
package main

import (
  "encoding/json"
  "net/http"

  "github.com/stripe/stripe-go/v76.0.0"
  "github.com/stripe/stripe-go/v76.0.0/setupintent"
)

type CheckoutData struct {
  ClientSecret string `json:"client_secret"`
}

func main() {
  stripe.Key = "<<YOUR_SECRET_KEY>>"

  http.HandleFunc("/create-intent", func(w http.ResponseWriter, r *http.Request) {
    var req struct {
      PaymentMethodID string `json:"payment_method_id"`
      ShouldSavePaymentMethod bool `json:"should_save_payment_method"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      log.Printf("json.NewDecoder.Decode: %v", err)
      return
    }
    params := &stripe.SetupIntentParams{
      Customer: stripe.String(c.ID), // The Customer ID you previously created
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      AutomaticPaymentMethods: &stripe.SetupIntentAutomaticPaymentMethodsParams{
        Enabled: stripe.Bool(true),
      },
      Confirm: stripe.Bool(true),
      PaymentMethod: stripe.String(req.PaymentMethodID), // the PaymentMethod ID sent by your client
      ReturnURL: stripe.String(string("your-app://stripe-redirect")), // Use the return url you set up in the previous step
      MandateData: &stripe.SetupIntentMandateDataParams{
        CustomerAcceptance: &stripe.SetupIntentMandateDataCustomerAcceptanceParams{
          Type: stripe.String("online"),
          Online: &stripe.SetupIntentMandateDataCustomerAcceptanceOnlineParams{
            IPAddress: stripe.String(/* your client's IP address */),
            UserAgent: stripe.String(r.UserAgent()),
          },
        },
      },
    }
    intent, err := setupintent.New(params);
    if err == nil {
      w.Header().Set("Content-Type", "application/json")
      w.WriteHeader(http.StatusOK)
      data := CheckoutData{
        ClientSecret: intent.ClientSecret,
      }
      json.NewEncoder(w).Encode(data)
    } else {
      if stripeErr, ok := err.(*stripe.Error); ok {
        switch stripeErr.Type {
          case stripe.ErrorTypeCard:
            http.Error(w, stripeErr.Msg, http.StatusInternalServerError)
          default:
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
      } else {
        http.Error(w, err.Error(), http.StatusInternalServerError)
      }
    }
  })

  http.ListenAndServe(":4242", nil)
}
```

```csharp
using System;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace StripeExampleApi.Controllers
{
  [Route("create-intent")]
  [ApiController]
  public class CheckoutApiController : Controller
  {
    public CheckoutApiController()
    {
      StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";
    }

    [HttpPost]
    public ActionResult Post(IntentCreateRequest request)
    {
      var options = new SetupIntentCreateOptions()
      {
        Customer = customer.Id, // The Customer ID you previously created
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        AutomaticPaymentMethods = new SetupIntentAutomaticPaymentMethodsOptions
        {
          Enabled = true,
        },
        Confirm = true,
        PaymentMethod = request.PaymentMethodId, // the PaymentMethod ID sent by your client
        ReturnUrl = "your-app://stripe-redirect", // Use the return url you set up in the previous step
        MandateData = new PaymentIntentMandateDataOptions
        {
          CustomerAcceptance = new PaymentIntentMandateDataCustomerAcceptanceOptions
          {
            Type = "online",
            Online = new PaymentIntentMandateDataCustomerAcceptanceOnlineOptions
            {
              IpAddress = ... /* The client's IP address*/,
              UserAgent = Request.Headers["User-Agent"].ToString()
            }
          },
        },
      };
      var service = new SetupIntentService();
      try
      {
        SetupIntent intent = service.Create(options);
        return Json(new { client_secret = intent.ClientSecret });
      }
      catch (StripeException e)
      {
        this.HttpContext.Response.StatusCode = 400;
        switch (e.StripeError.Type)
        {
          case "card_error":
            return Json(new { error = e.Message }); // For card errors, the message can be shown to your users
          default:
            return Json(new { error = e.Message }); // Other errors may not be localized
        }
      }
    }

    public class IntentCreateRequest
    {
      [JsonProperty("payment_method_id")]
      public string PaymentMethodId { get; set; }
      [JsonProperty("should_save_payment_method")]
      public bool ShouldSavePaymentMethod { get; set; }
    }
  }
}
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/customers/create_api-version=2025-03-31

The Setup Intents API guides you through the process of setting up and saving a customer’s payment credentials for future payments. Use these endpoints to manage setup processes.

```APIDOC
## Setup Intents Endpoints

### Description
Manages the setup of payment credentials for future payments.

### Endpoints
- `POST /v1/setup_intents`
- `GET /v1/setup_intents/:id`
- `POST /v1/setup_intents/:id/cancel`
- `POST /v1/setup_intents/:id/confirm`
- `POST /v1/setup_intents/:id/verify_microdeposits`

### Example Request (POST /v1/setup_intents)
```json
{
  "payment_method_types": ["card"]
}
```

### Example Response
```json
{
  "id": "seti_1Examp",
  "object": "setup_intent",
  "status": "requires_payment_method"
}
```
```

--------------------------------

### Install Stripe Go library via go get

Source: https://docs.stripe.com/connect/onboarding/quickstart

Integrate the Stripe Go client library into your project using `go get`. This command fetches a specific version of the `github.com/stripe/stripe-go` module, allowing your Go application to interact with the Stripe API.

```bash
go get -u github.com/stripe/stripe-go/v73@v75.3.0
```

--------------------------------

### Create Stripe Product and Price with Go SDK

Source: https://docs.stripe.com/get-started/development-environment

This Go program initializes the Stripe SDK with a test key and demonstrates how to create a new subscription product and an associated recurring price. It captures the product ID from the creation response to link it to the price. The output includes the IDs of the newly created product and price resources.

```go
package main

import (
  "fmt"
  "github.com/stripe/stripe-go/v83"
  "github.com/stripe/stripe-go/v83/product"
  "github.com/stripe/stripe-go/v83/price"
)

func main() {
  stripe.Key = "sk_test_YOUR_SECRET_KEY_HERE"

	product_params := &stripe.ProductParams{
		Name:        stripe.String("Starter Subscription"),
		Description: stripe.String("$12/Month subscription"),
	}
	starter_product, _ := product.New(product_params)

	price_params := &stripe.PriceParams{
		Currency: stripe.String(string(stripe.CurrencyUSD)),
		Product:  stripe.String(starter_product.ID),
		Recurring: &stripe.PriceRecurringParams{
			Interval: stripe.String(string(stripe.PriceRecurringIntervalMonth)),
		},
		UnitAmount: stripe.Int64(1200),
	}
	starter_price, _ := price.New(price_params)

	fmt.Println("Success! Here is your starter subscription product id: " + starter_product.ID)
	fmt.Println("Success! Here is your starter subscription price id: " + starter_price.ID)
}
```

--------------------------------

### POST /v1/setup_intents - Create Setup Intent

Source: https://docs.stripe.com/payments/bacs-debit/accept-a-payment

This endpoint creates a new Setup Intent. A Setup Intent is a payment setup process used to collect payment method details from your customer for future use. This example configures it for BACS Direct Debit with specific mandate options.

```APIDOC
## POST /v1/setup_intents

### Description
This endpoint creates a new Setup Intent. A Setup Intent is a payment setup process used to collect payment method details from your customer for future use. This example configures it for BACS Direct Debit with specific mandate options.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Request Body
- **payment_method_types** (array of string) - Required - An array of payment method types that this Setup Intent can use. For BACS Direct Debit, include `bacs_debit`.
- **payment_method_options** (object) - Optional - Configuration for specific payment method types.
    - **bacs_debit** (object) - Optional - Configuration for BACS Direct Debit.
        - **mandate_options** (object) - Optional - Options to configure a BACS Direct Debit mandate.
            - **reference_prefix** (string) - Optional - A prefix for the mandate reference, used for compliance. Example: `EX4MPL3-`

### Request Example
```json
{
  "payment_method_types": ["bacs_debit"],
  "payment_method_options": {
    "bacs_debit": {
      "mandate_options": {
        "reference_prefix": "EX4MPL3-"
      }
    }
  }
}
```

### Response
#### Success Response (200)
A successful response would return a SetupIntent object. The exact fields can be numerous. Key fields include:
- **id** (string) - Unique identifier for the object.
- **object** (string) - Value is `setup_intent`.
- **status** (string) - The status of the Setup Intent (e.g., `requires_payment_method`, `succeeded`).
- **client_secret** (string) - The client secret of this Setup Intent. Used for client-side confirmation.
- **payment_method_types** (array of string) - The payment method types that this Setup Intent is allowed to set up.
- **payment_method_options** (object) - Payment method-specific configuration.

#### Response Example
```json
{
  "id": "seti_123abc...",
  "object": "setup_intent",
  "livemode": false,
  "client_secret": "seti_123abc..._secret_...",
  "created": 1678886400,
  "description": null,
  "last_setup_error": null,
  "payment_method": null,
  "payment_method_options": {
    "bacs_debit": {
      "mandate_options": {
        "reference_prefix": "EX4MPL3-"
      }
    }
  },
  "payment_method_types": [
    "bacs_debit"
  ],
  "single_use_mandate": null,
  "status": "requires_payment_method",
  "usage": "off_session"
}
```
```

--------------------------------

### Create Stripe SetupIntent with Multiple Languages

Source: https://docs.stripe.com/financial-accounts/connect/moving-money/working-with-bankaccount-objects

These code examples demonstrate how to create a Stripe `SetupIntent` using various programming languages. A `SetupIntent` is used to set up a payment method for future payments without immediately charging it. Each example requires a Stripe secret key, a `payment_method` ID, and a `stripe_account` ID for connected accounts. The process involves calling the Stripe API or SDK to instantiate a new `SetupIntent` object.

```curl
curl https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -H "Stripe-Account: {{CONNECTEDACCOUNT_ID}}" \
  -d payment_method="{{PAYMENTMETHOD_ID}}"
```

```cli
stripe setup_intents create  \
  --stripe-account {{CONNECTEDACCOUNT_ID}} \
  --payment-method="{{PAYMENTMETHOD_ID}}"
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create(
  {payment_method: '{{PAYMENTMETHOD_ID}}'},
  {stripe_account: '{{CONNECTEDACCOUNT_ID}}'},
)
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
setup_intent = client.v1.setup_intents.create(
  {"payment_method": "{{PAYMENTMETHOD_ID}}"},
  {"stripe_account": "{{CONNECTEDACCOUNT_ID}}"},
)
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$setupIntent = $stripe->setupIntents->create(
  ['payment_method' => '{{PAYMENTMETHOD_ID}}'],
  ['stripe_account' => '{{CONNECTEDACCOUNT_ID}}']
);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SetupIntentCreateParams params =
  SetupIntentCreateParams.builder()
    .setPaymentMethod("{{PAYMENTMETHOD_ID}}")
    .build();

RequestOptions requestOptions =
  RequestOptions.builder().setStripeAccount("{{CONNECTEDACCOUNT_ID}}").build();
// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.

SetupIntent setupIntent = client.v1().setupIntents().create(params, requestOptions);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntent = await stripe.setupIntents.create(
  {
    payment_method: '{{PAYMENTMETHOD_ID}}',
  },
  {
    stripeAccount: '{{CONNECTEDACCOUNT_ID}}',
  }
);
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SetupIntentCreateParams{
  PaymentMethod: stripe.String("{{PAYMENTMETHOD_ID}}"),
}
params.SetStripeAccount("{{CONNECTEDACCOUNT_ID}}")
result, err := sc.V1SetupIntents.Create(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SetupIntentCreateOptions
{
    PaymentMethod = "{{PAYMENTMETHOD_ID}}",
};
var requestOptions = new RequestOptions
{
    StripeAccount = "{{CONNECTEDACCOUNT_ID}}",
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options, requestOptions);
```

--------------------------------

### Example Stripe Event Object for App Install (JSON)

Source: https://docs.stripe.com/stripe-apps/build-backend

This JSON object provides an example of a Stripe Event, specifically for `app.install.created`. It contains crucial information such as the event ID, type, and the `account` ID of the merchant triggering the event, which is vital for monitoring app installations and making API calls on behalf of users.

```json
{
  "id": "evt_orWziM4j7CiRL8",
  "livemode": true,
  "object": "event",
  "type": "app.install.created",
  "account": "acct_orWziM4j7CiRL8",
  "pending_webhooks": 2,
  "created": 1349654313,
  "data": {...}
}
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/setup_attempts/object_api-version=2025-03-31

Lists all SetupIntents. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters

```

--------------------------------

### Run Client Application with npm

Source: https://docs.stripe.com/checkout/quickstart

This command starts the client-side application, typically a development server, after all dependencies have been installed. It makes the application accessible via a web browser.

```shell
npm start
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/setup_intents

Lists all SetupIntents, allowing for filtering and pagination.

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntents, allowing for filtering and pagination.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters for this endpoint.

#### Query Parameters
- Query parameters for filtering and pagination not detailed in the input.

#### Request Body
- No request body for GET requests.

### Request Example
{
  "example": "No request body for GET."
}

### Response
#### Success Response (200)
- Response fields not detailed in the input.

#### Response Example
{
  "example": "Response body details not provided in the input text."
}
```

--------------------------------

### Create Stripe Product and Price with .NET SDK

Source: https://docs.stripe.com/get-started/development-environment

This C# code snippet demonstrates how to programmatically create a 'Starter Subscription' product and a monthly recurring price for it using the Stripe .NET SDK. It sets the API key, defines product and price options, and prints the generated product and price IDs to the console. Ensure you have the Stripe .NET library installed and replace the placeholder API key with your actual test key.

```dotnet
using System;
using Stripe;

class Program
{
  static void Main(string[] args)
  {
    StripeConfiguration.ApiKey = "sk_test_YOUR_SECRET_KEY_HERE";

    var optionsProduct = new ProductCreateOptions
    {
      Name = "Starter Subscription",
      Description = "$12/Month subscription",
    };
    var serviceProduct = new ProductService();
    Product product = serviceProduct.Create(optionsProduct);
    Console.Write("Success! Here is your starter subscription product id: {0}\n", product.Id);

    var optionsPrice = new PriceCreateOptions
    {
      UnitAmount = 1200,
      Currency = "usd",
      Recurring = new PriceRecurringOptions
      {
          Interval = "month",
      },
      Product = product.Id
    };
    var servicePrice = new PriceService();
    Price price = servicePrice.Create(optionsPrice);
    Console.Write("Success! Here is your starter subscription price id: {0}\n", price.Id);
  }
}
```

--------------------------------

### Install Stripe Client Libraries

Source: https://docs.stripe.com/payments/klarna/set-up-future-payments

This section provides installation instructions for the Stripe client libraries across various programming languages. It includes commands for PHP with Composer, Java with Gradle and Maven, Node.js with npm, Go with Go Modules, and .NET with dotnet CLI or NuGet.

```bash
composer require stripe/stripe-php
```

```java
implementation "com.stripe:stripe-java:30.0.0"
```

```xml
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>30.0.0</version>
</dependency>
```

```bash
npm install stripe --save
```

```bash
go mod init
go get -u github.com/stripe/stripe-go/v83
```

```go
import (
  "github.com/stripe/stripe-go/v83"
)
```

```bash
dotnet add package Stripe.net
dotnet restore
```

```bash
Install-Package Stripe.net
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/payment_method_configurations/object_api-version=2024-10-28

Endpoints for managing Setup Intents, which guide you through saving customer payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a SetupIntent when you're ready to collect your customer's payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- Not specified in documentation.

#### Query Parameters
- Not specified in documentation.

#### Request Body
- Not specified in documentation.

### Request Example
{}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates an existing SetupIntent by its ID.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters
- Not specified in documentation.

#### Request Body
- Not specified in documentation.

### Request Example
{}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves a SetupIntent by its ID.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
- Not specified in documentation.

#### Request Body
- Not specified in documentation.

### Request Example
{}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- Not specified in documentation.

#### Query Parameters
- Not specified in documentation.

#### Request Body
- Not specified in documentation.

### Request Example
{}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent. Only a SetupIntent with a status of 'requires_payment_method' or 'requires_action' can be canceled.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters
- Not specified in documentation.

#### Request Body
- Not specified in documentation.

### Request Example
{}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent. Confirmation requires a payment method to be attached to the SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters
- Not specified in documentation.

#### Request Body
- Not specified in documentation.

### Request Example
{}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies microdeposits for a SetupIntent. This is typically used for bank account verification.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent for which to verify microdeposits.

#### Query Parameters
- Not specified in documentation.

#### Request Body
- Not specified in documentation.

### Request Example
{}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{}
```

--------------------------------

### Example package.json with Stripe Dependency

Source: https://docs.stripe.com/get-started/development-environment

An example `package.json` file demonstrating the structure and inclusion of the Stripe Node.js SDK as a dependency after installation. It shows the `stripe` package listed under `dependencies`.

```json
{
  "name": "stripe-node-example",
  "version": "1.0.0",
  "description": "A Stripe demo",
  "main": "index.js",
  "scripts": {
    "node ": "node create_price.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "stripe": "^19.0.0"
  }
}
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/api/customer_portal/configurations/create_api-version=2025-07-30

Creates a new SetupIntent to guide through setting up and saving customer payment credentials. A SetupIntent transitions through multiple statuses as it guides you through the setup process.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent to guide through setting up and saving customer payment credentials. A SetupIntent transitions through multiple statuses as it guides you through the setup process.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- Not provided

#### Query Parameters
- Not provided

#### Request Body
- Not provided

### Request Example
{}

### Response
#### Success Response (200)
- Not provided

#### Response Example
{}
```

--------------------------------

### Go Backend to Serve Stripe Checkout Page

Source: https://docs.stripe.com/payments/revolut-pay/set-up-future-payments

Demonstrates a Go server using 'net/http' and 'html/template' to render a checkout page. It sets up a handler to fetch or create a Stripe 'SetupIntent' and passes its 'ClientSecret' to the HTML template.

```go
package main

import (
  "html/template"
  "net/http"

  stripe "github.com/stripe/stripe-go/v76.0.0"
)

type CheckoutData struct {
  ClientSecret string
}

func main() {
  checkoutTmpl := template.Must(template.ParseFiles("views/checkout.html"))

  http.HandleFunc("/checkout", func(w http.ResponseWriter, r *http.Request) {
    intent := // ... Fetch or create the SetupIntent
    data := CheckoutData{
      ClientSecret: intent.ClientSecret,
    }
    checkoutTmpl.Execute(w, data)
  })

  http.ListenAndServe(":3000", nil)
}
```

--------------------------------

### Example Stripe Payment Intent Object with Installments

Source: https://docs.stripe.com/payments/jp-installments/accept-a-payment

This JSON object illustrates the structure of a Stripe Payment Intent after retrieval, specifically highlighting the `installments` details within `payment_method_details.card` and `payment_method_options.card`. This demonstrates how installment plan information is represented.

```json
{
  "id": "pi_...",
  "object": "payment_intent",
  "amount": 100000,
...
  "charges": {
    "data": [
      {
        "id": "ch_...",
        "object": "charge",
        "amount": 100000,
        "payment_method_details": {
          "card": {
            "installments": {
              "plan": {
                "count": 3,
                "interval": "month",
                "type": "fixed_count"
              }
            }
          },
          ...
        },
        ...
      }
    ]
  },
...
  "payment_method_options": {
    "card": {
      "installments": {
        "enabled": true,
        "plan": {
          "count": 3,
          "interval": "month",
          "type": "fixed_count"
        },
        "available_plans": []
      }
    }
  }
}
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/api/setup_intents

Creates a SetupIntent to guide the process of setting up and saving customer payment credentials for future use.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a SetupIntent to guide the process of setting up and saving customer payment credentials for future use.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters for this endpoint.

#### Query Parameters
- No query parameters specified in the input.

#### Request Body
- Request body parameters not detailed in the input.

### Request Example
{
  "example": "Request body details not provided in the input text."
}

### Response
#### Success Response (200)
- Response fields not detailed in the input.

#### Response Example
{
  "example": "Response body details not provided in the input text."
}
```

--------------------------------

### List Stripe SetupIntents with parameters (Java)

Source: https://docs.stripe.com/api/setup_intents/create_api-version=2024-10-28

This Java example shows how to list multiple Stripe SetupIntents, allowing for filtering and pagination through parameters. It requires setting your Stripe API key and constructing `SetupIntentListParams` to specify criteria like a result limit before calling the static `list` method.

```Java
Stripe.apiKey = "sk_test_YOUR_SECRET_KEY_HERE";
SetupIntentListParams params = SetupIntentListParams.builder().setLimit(3L).build();
SetupIntentCollection setupIntents = SetupIntent.list(params);
```

--------------------------------

### Install and import Stripe Go SDK

Source: https://docs.stripe.com/payments/save-and-reuse-cards-only

This snippet shows how to install the Stripe Go SDK using `go get` and then import the `stripe-go/v83` package into a Go application to begin using Stripe functionalities.

```bash
go get -u github.com/stripe/stripe-go/v83
```

```go
// Then import the package
import (
  "github.com/stripe/stripe-go/v83"
)
```

--------------------------------

### GET /v1/setup_intents/{SETUP_INTENT_ID}

Source: https://docs.stripe.com/payments/ideal/set-up-payment

Retrieves a Setup Intent by its unique identifier. This endpoint allows you to fetch details about a specific Setup Intent, optionally expanding related objects like the latest attempt to get more detailed information about its status and outcome.

```APIDOC
## GET /v1/setup_intents/{SETUP_INTENT_ID}

### Description
Retrieves a Setup Intent by its unique identifier. This endpoint allows you to fetch details about a specific Setup Intent, optionally expanding related objects like the latest attempt to get more detailed information about its status and outcome.

### Method
GET

### Endpoint
/v1/setup_intents/{SETUP_INTENT_ID}

### Parameters
#### Path Parameters
- **SETUP_INTENT_ID** (string) - Required - The unique identifier of the Setup Intent to retrieve.

#### Query Parameters
- **expand** (array of strings) - Optional - A list of objects to expand in the response. For example, `['latest_attempt']` will return the full latest SetupAttempt object.

#### Request Body
(Not applicable for GET requests)

### Request Example
GET /v1/setup_intents/seti_1234567890abcdef?expand[]=latest_attempt

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **object** (string) - String representing the object’s type. Value is "setup_intent".
- **status** (string) - The current status of the SetupIntent. E.g., `succeeded`, `requires_action`, `requires_payment_method`.
- **customer** (string) - The ID of the Customer this SetupIntent belongs to, if any.
- **usage** (string) - Indicates whether the SetupIntent is for one-time or off-session use.
- **latest_attempt** (object) - (Expanded) The latest SetupAttempt object, if `expand=['latest_attempt']` was used. Contains details like `status`, `payment_method_details`, etc.

#### Response Example
```json
{
  "id": "seti_1234567890abcdef",
  "object": "setup_intent",
  "customer": null,
  "livemode": false,
  "status": "succeeded",
  "usage": "on_session",
  "latest_attempt": {
    "id": "setatt_1234567890abcdef",
    "object": "setup_attempt",
    "created": 1678886400,
    "customer": null,
    "livemode": false,
    "setup_intent": "seti_1234567890abcdef",
    "status": "succeeded",
    "usage": "on_session",
    "payment_method_details": {
      "type": "card",
      "card": {
        "brand": "visa",
        "country": "US"
      }
    }
  }
}
```
```

--------------------------------

### Install Stripe Server-Side Library

Source: https://docs.stripe.com/payments/alipay/accept-a-payment

These examples provide instructions for installing the Stripe official server-side client libraries using language-specific package managers and configuration files.

```bash
sudo gem install stripe
```

```ruby
gem 'stripe'
```

```bash
pip3 install --upgrade stripe
```

```python
stripe>=5.0.0
```

--------------------------------

### GET /v1/invoices/{INVOICE_ID}

Source: https://docs.stripe.com/payments/jp-installments/accept-a-payment

Retrieve a specific Invoice object to see details, including the selected installment plan if applicable. The installment plan is visible in the PaymentIntent associated with the Invoice.

```APIDOC
## GET /v1/invoices/{INVOICE_ID}

### Description
Retrieve a specific Invoice object to see details, including the selected installment plan if applicable. The installment plan is visible in the PaymentIntent associated with the Invoice.

### Method
GET

### Endpoint
/v1/invoices/{INVOICE_ID}

### Parameters
#### Path Parameters
- **INVOICE_ID** (string) - Required - The ID of the invoice to retrieve.

#### Query Parameters
(None)

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
A Stripe Invoice object containing details about the invoice, including a reference to the PaymentIntent if payment has occurred.

#### Response Example
```json
{
  "id": "in_123example456",
  "object": "invoice",
  "currency": "jpy",
  "total": 10000,
  "payment_intent": "pi_789example012",
  "status": "paid"
}
```
```

--------------------------------

### Install Stripe iOS SDK using CocoaPods

Source: https://docs.stripe.com/connect/end-to-end-marketplace

These commands guide you through setting up and managing the Stripe iOS SDK using CocoaPods. This includes initializing a Podfile, adding the StripePaymentsUI dependency, installing the pods, and updating them later.

```bash
pod init
```

```podfile
pod 'StripePaymentsUI'
```

```bash
pod install
```

```bash
pod update StripePaymentsUI
```

--------------------------------

### Update Stripe Embedded Component Appearance After Initialization (Kotlin, Java)

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

These code examples demonstrate how to update the appearance of an already initialized Stripe embedded component. By calling the `update` method on `embeddedComponentManager` with a new `Appearance` object, you can dynamically change UI elements like colors.

```kotlin
val appearance = Appearance.Builder()
    .colors(
        Colors.Builder()
            .primary(ContextCompat.getColor(context, R.color.primary))
            .build()
    )
    .build()
embeddedComponentManager.update(appearance = appearance)
```

```java
Appearance appearance = new Appearance.Builder()
    .colors(
        new Colors.Builder()
            .primary(ContextCompat.getColor(context, R.color.primary))
            .build()
    )
    .build();
embeddedComponentManager.update(appearance);
```

--------------------------------

### Create Stripe Product (Python, PHP, Java, Node.js, Go, C#)

Source: https://docs.stripe.com/billing/subscriptions/usage-based/use-cases/credits-based-pricing-model

This snippet demonstrates how to create a new product in Stripe. It involves initializing the Stripe client with an API key and then calling the product creation method with parameters for description and name. This is a foundational step for defining items sold through Stripe.

```python
product = client.v1.products.create({
  "description": "Input usage fee for Alpaca AI",
  "name": "Alpaca AI Input Usage",
})
```

```php
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$product = $stripe->products->create([
  'description' => 'Input usage fee for Alpaca AI',
  'name' => 'Alpaca AI Input Usage',
]);
```

```java
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

ProductCreateParams params =
  ProductCreateParams.builder()
    .setDescription("Input usage fee for Alpaca AI")
    .setName("Alpaca AI Input Usage")
    .build();

Product product = client.v1().products().create(params);
```

```javascript
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const product = await stripe.products.create({
  description: 'Input usage fee for Alpaca AI',
  name: 'Alpaca AI Input Usage',
});
```

```go
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.ProductCreateParams{
  Description: stripe.String("Input usage fee for Alpaca AI"),
  Name: stripe.String("Alpaca AI Input Usage"),
}
result, err := sc.V1Products.Create(context.TODO(), params)
```

```csharp
var options = new ProductCreateOptions
{
    Description = "Input usage fee for Alpaca AI",
    Name = "Alpaca AI Input Usage",
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Products;
Product product = service.Create(options);
```

--------------------------------

### Install Stripe .NET SDK

Source: https://docs.stripe.com/connect/onboarding/quickstart

This snippet provides instructions for installing the Stripe .NET library using either the `dotnet` CLI or the NuGet Package Manager Console. This installation is essential for integrating Stripe's API into .NET applications.

```bash
dotnet add package Stripe.net --version 42.3.0
```

```powershell
Install-Package Stripe.net -Version 42.3.0
```

--------------------------------

### Create a Stripe SetupIntent on the Server-Side

Source: https://docs.stripe.com/connect/direct-charges-multiple-accounts

These code examples demonstrate how to initialize the Stripe client and create a SetupIntent on your server. A SetupIntent is used to save a customer's payment method details for future payments. Ensure you replace `<<YOUR_SECRET_KEY>>` with your actual Stripe secret key and `{{CUSTOMER_ID}}` with the ID of the customer. Some SDK versions may require removing '.v1' from the method call.

```python
# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
setup_intent = client.v1.setup_intents.create({"customer": "{{CUSTOMER_ID}}"})
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$setupIntent = $stripe->setupIntents->create(['customer' => '{{CUSTOMER_ID}}']);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SetupIntentCreateParams params =
  SetupIntentCreateParams.builder().setCustomer("{{CUSTOMER_ID}}").build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
SetupIntent setupIntent = client.v1().setupIntents().create(params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntent = await stripe.setupIntents.create({
  customer: '{{CUSTOMER_ID}}',
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SetupIntentCreateParams{
  Customer: stripe.String("{{CUSTOMER_ID}}"),
}
result, err := sc.V1SetupIntents.Create(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SetupIntentCreateOptions { Customer = "{{CUSTOMER_ID}}" };
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options);
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/webhook_endpoints/create_api-version=2024-10-28

Lists all SetupIntents.

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntents, which guide the process of setting up and saving a customer’s payment credentials for future payments.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- None provided

#### Query Parameters
- Not specified in documentation.

#### Request Body
- None provided

### Request Example
{
  "example": "No request body required for GET"
}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{
  "example": "Response body not specified"
}
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/terminal/readers_api-version=2025-05-28

The Setup Intents API guides you through the process of setting up and saving a customer’s payment credentials for future payments. It allows you to create, retrieve, cancel, and confirm setup intents.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Request Body
- **customer** (string) - Optional - ID of the Customer this SetupIntent belongs to, if one exists.
- **payment_method_types** (array) - Required - The list of payment method types to use for this SetupIntent.

### Request Example
```json
{
  "customer": "cus_123",
  "payment_method_types": ["card"]
}
```

### Response
#### Success Response (200)
- **id** (string) - The ID of the SetupIntent.
- **status** (string) - Status of the SetupIntent.

#### Response Example
```json
{
  "id": "seti_123",
  "status": "requires_payment_method"
}
```

---

## GET /v1/setup_intents/:id

### Description
Retrieves a SetupIntent object.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

### Response
#### Success Response (200)
- **id** (string) - The ID of the SetupIntent.
- **status** (string) - Status of the SetupIntent.

#### Response Example
```json
{
  "id": "seti_123",
  "status": "succeeded"
}
```

---

## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

### Response
#### Success Response (200)
- **id** (string) - The ID of the SetupIntent.
- **status** (string) - Status of the SetupIntent.

#### Response Example
```json
{
  "id": "seti_123",
  "status": "canceled"
}
```

---

## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

### Response
#### Success Response (200)
- **id** (string) - The ID of the SetupIntent.
- **status** (string) - Status of the SetupIntent.

#### Response Example
```json
{
  "id": "seti_123",
  "status": "succeeded"
}
```
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/account/create_login_link

Endpoints for managing Setup Intents, which guide you through the process of setting up and saving a customer's payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Request Body
- **customer** (string) - Optional - The ID of the Customer this SetupIntent belongs to.
- **payment_method_types** (array) - Optional -  A list of payment method types to enable for this SetupIntent.

### Request Example
```json
{
  "customer": "cus_123",
  "payment_method_types": ["card"]
}
```

### Response
#### Success Response (200)
- **id** (string) - The ID of the SetupIntent.
- **status** (string) - The status of the SetupIntent.

#### Response Example
```json
{
  "id": "seti_123",
  "status": "requires_payment_method"
}
```

---

## GET /v1/setup_intents/:id

### Description
Retrieves a SetupIntent by its ID.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

### Response
#### Success Response (200)
- **id** (string) - The ID of the SetupIntent.
- **status** (string) - The status of the SetupIntent.

#### Response Example
```json
{
  "id": "seti_123",
  "status": "requires_payment_method"
}
```
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/financial-accounts/connect/examples/moving-money

Creates a SetupIntent to collect and confirm a customer's payment method details for future use. This example demonstrates attaching a US bank account.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a SetupIntent to collect and confirm a customer's payment method details for future use. This example specifically demonstrates attaching a US bank account.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Request Body
- **payment_method_types** (array of string) - Required - A list of the payment method types that this SetupIntent is allowed to set up.
- **payment_method_data** (object) - Required - Details about the payment method being set up.
    - **type** (string) - Required - The type of the payment method (e.g., `us_bank_account`).
    - **us_bank_account** (object) - Required - Details for a US bank account payment method.
        - **routing_number** (string) - Required - The routing number for the bank account.
        - **account_number** (string) - Required - The account number for the bank account.
        - **account_holder_type** (string) - Required - The type of the account holder, either `individual` or `company`.
    - **billing_details** (object) - Required - Billing details associated with the payment method.
        - **name** (string) - Required - The full name of the customer.
- **confirm** (boolean) - Required - Set to `true` to confirm the SetupIntent immediately.

### Request Example
```json
{
  "payment_method_types": ["us_bank_account"],
  "payment_method_data": {
    "type": "us_bank_account",
    "us_bank_account": {
      "routing_number": "110000000",
      "account_number": "000123456789",
      "account_holder_type": "individual"
    },
    "billing_details": {
      "name": "John doe"
    }
  },
  "confirm": true
}
```

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the SetupIntent.
- **object** (string) - String representing the object's type. Objects of the same type share the same value.
- **application** (string, nullable) - ID of the application that created the SetupIntent.
- **client_secret** (string) - The client secret of this SetupIntent.
- **created** (integer) - Time at which the object was created.
- **customer** (string, nullable) - ID of the Customer this SetupIntent belongs to, if one exists.
- **payment_method** (string, nullable) - ID of the PaymentMethod that this SetupIntent is setting up.
- **status** (string) - Status of this SetupIntent, one of `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `canceled`, or `succeeded`.
- **usage** (string) - Indicates how the payment method is intended to be used in the future.

#### Response Example
```json
{
  "id": "seti_1K72Lp2eZvKYlo2CcV0gN1N1",
  "object": "setup_intent",
  "application": "app_12345",
  "cancellation_reason": null,
  "client_secret": "seti_1K72Lp2eZvKYlo2CcV0gN1N1_secret_AAAAAAAAAAAA",
  "created": 1642528487,
  "customer": "cus_AbCDefGhIjKlMn",
  "description": null,
  "flow_directions": [
    "outbound"
  ],
  "last_setup_error": null,
  "latest_attempt": null,
  "livemode": false,
  "mandate": null,
  "metadata": {},
  "next_action": null,
  "on_behalf_of": null,
  "payment_method": "pm_1K72Lp2eZvKYlo2Cd3fVn2V2",
  "payment_method_options": {},
  "payment_method_types": [
    "us_bank_account"
  ],
  "single_use_mandate": null,
  "status": "succeeded",
  "usage": "off_session"
}
```
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/baas/start-integration/integration-guides/embedded-finance

Creates a Setup Intent object. A Setup Intent is a payment intent that can be used to set up a customer's payment method for future payments without immediately charging them.

```APIDOC
## POST /v1/setup_intents

### Description
This endpoint creates a new Setup Intent object. Setup Intents are used to save payment method information for future payments without initiating an immediate charge. This specific example demonstrates setting up a US bank account with customer acceptance mandate data.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Request Body
- **attach_to_self** (boolean) - Required - Specifies whether to attach the SetupIntent to the current authenticated account.
- **flow_directions** (array of strings) - Required - The directions that this SetupIntent is intended to flow payment methods. Supported values: `inbound`, `outbound`.
- **payment_method_types** (array of strings) - Required - The payment method types that this SetupIntent is intended to set up. Supported values: `us_bank_account`.
- **payment_method_data** (object) - Required - Data to be used to create a PaymentMethod.
  - **type** (string) - Required - The type of the PaymentMethod. E.g., `us_bank_account`.
  - **us_bank_account** (object) - Required - Details for a US bank account PaymentMethod.
    - **routing_number** (string) - Required - The routing number for the US bank account.
    - **account_number** (string) - Required - The account number for the US bank account.
    - **account_holder_type** (string) - Required - The type of entity that holds the account. Supported values: `individual`, `company`.
  - **billing_details** (object) - Required - Billing information for the PaymentMethod.
    - **name** (string) - Required - The full name of the account holder.
- **confirm** (boolean) - Required - Set to `true` to confirm the SetupIntent immediately upon creation.
- **mandate_data** (object) - Required - This hash contains details about the customer's acceptance of the mandate. Only applies to `us_bank_account` payment methods.
  - **customer_acceptance** (object) - Required - Details about the customer's acceptance of the mandate.
    - **type** (string) - Required - The type of customer acceptance. Supported values: `online`.
    - **online** (object) - Required - Details about the online customer acceptance.
      - **ip_address** (string) - Required - The IP address from which the mandate was accepted.

### Request Example
```json
{
  "attach_to_self": true,
  "flow_directions": [
    "inbound",
    "outbound"
  ],
  "payment_method_types": [
    "us_bank_account"
  ],
  "payment_method_data": {
    "type": "us_bank_account",
    "us_bank_account": {
      "routing_number": "110000000",
      "account_number": "000123456789",
      "account_holder_type": "company"
    },
    "billing_details": {
      "name": "Company Corp"
    }
  },
  "confirm": true,
  "mandate_data": {
    "customer_acceptance": {
      "type": "online",
      "online": {
        "ip_address": "123.123.123.123"
      }
    }
  }
}
```

### Response
#### Success Response (200)
A SetupIntent object is returned, representing the status and details of the setup process. This object will include details such as the `id`, `status`, `payment_method`, and any `mandate` information.

#### Response Example
```json
{
  "id": "seti_12345",
  "object": "setup_intent",
  "status": "succeeded",
  "livemode": false,
  "client_secret": "seti_12345_secret_abc",
  "payment_method": "pm_12345",
  "usage": "off_session",
  "mandate": {
    "id": "mandate_12345",
    "object": "mandate",
    "status": "active",
    "customer_acceptance": {
      "type": "online",
      "online": {
        "ip_address": "123.123.123.123",
        "user_agent": "Mozilla/5.0 (...)"
      }
    }
  },
  "created": 1678886400,
  "description": null,
  "last_setup_error": null,
  "metadata": {},
  "next_action": null,
  "payment_method_options": {
    "us_bank_account": {
      "financial_connections": null,
      "setup_future_usage": "off_session",
      "verification_method": "automatic"
    }
  },
  "payment_method_types": [
    "us_bank_account"
  ]
}
```
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/issuing/authorizations/object_api-version=2024-12-18

Lists all SetupIntents, allowing you to review the history of payment credential setup processes.

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No specific query parameters provided in the text.

#### Request Body
- No request body.

### Request Example
{}

### Response
#### Success Response (200)
- No specific response fields provided in the text.

#### Response Example
{}
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/confirmation_tokens/object_api-version=2025-06-30

The Setup Intents API guides you through the process of setting up and saving a customer’s payment credentials for future payments. It allows you to create, retrieve, cancel and confirm setup intents.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents

### Request Body
- **customer** (string) - Optional - ID of the Customer this SetupIntent belongs to, if one exists.
- **payment_method_types** (array) - Optional - The list of payment method types (e.g., card) that this SetupIntent is allowed to set up.

### Request Example
{
  "customer": "cus_Examp1e",
  "payment_method_types": ["card"]
}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the SetupIntent.
- **status** (string) - Status of the SetupIntent (e.g., requires_payment_method, succeeded).

#### Response Example
{
  "id": "seti_1Examp1e",
  "status": "requires_payment_method"
}

---

## GET /v1/setup_intents/:id

### Description
Retrieves a SetupIntent object by its ID.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the SetupIntent.
- **status** (string) - Status of the SetupIntent.

#### Response Example
{
  "id": "seti_1Examp1e",
  "status": "succeeded"
}
```

--------------------------------

### Install Stripe Go Client Library

Source: https://docs.stripe.com/billing/subscriptions/build-subscriptions

This snippet shows how to initialize Go Modules and then install the Stripe Go client library. It also includes the necessary import statement for using the package in your Go code.

```bash
# Make sure your project is using Go Modules
go mod init
# Install stripe-go
go get -u github.com/stripe/stripe-go/v83
```

```go
import (
  "github.com/stripe/stripe-go/v83"
)
```

--------------------------------

### Stripe App Successful Installation Redirect URLs

Source: https://docs.stripe.com/stripe-apps/install-links

These URLs demonstrate the redirect format after a user successfully installs a Stripe app, including parameters like `user_id`, `account_id`, `state`, and a crucial `install_signature`. The second example shows the addition of `livemode=false` for installations in a test or sandbox environment.

```url
https://example.com/callback/stripe?user_id={USER_ID}&account_id={CONNECTED_ACCOUNT_ID}&state={STATE}&install_signature={INSTALL_SIGNATURE}
```

```url
https://example.com/callback/stripe?user_id={USER_ID}&account_id={CONNECTED_ACCOUNT_ID}&state={STATE}&install_signature={INSTALL_SIGNATURE}&livemode=false
```

--------------------------------

### Initialize EmbeddedComponentManager for Android in ViewModel

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components_platform=android

Instantiate the `EmbeddedComponentManager` within an Android `ViewModel` using your publishable key and a lambda function to asynchronously fetch the client secret from your backend. This setup ensures the manager persists across configuration changes and securely handles client secret retrieval for API calls.

```Kotlin
class MyActivityViewModel : ViewModel() {
    val embeddedComponentManager: EmbeddedComponentManager =
        EmbeddedComponentManager(
            // This is a placeholder - it should be replaced with your publishable API key.
            // Sign in to see your own test API key embedded in code samples.
            // Don't submit any personally identifiable information in requests made with this key.
            publishableKey = 
"pk_test_TYooMQauvdEDq54NiTphI7jx"
,
            fetchClientSecret = ::fetchClientSecret,
        )

    private suspend fun fetchClientSecret(): String? =
        try {
            // Fetch the AccountSession client secret
            Fuel.post("https://{{YOUR_SERVER_BASE_URL}}/account_session")
                .awaitString()
                .let { JSONObject(it).getString("client_secret") }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            // Handle errors on the client side here
            println("Error fetching client secret: ${error.message}")
            null
        }
}
```

--------------------------------

### Create a SetupIntent (Server-side)

Source: https://docs.stripe.com/payments/ideal/set-up-payment

This set of examples demonstrates how to create a SetupIntent on your server. A SetupIntent tracks the steps involved in setting up a customer's payment method for future use, such as for subscriptions or saved cards. This specific example configures the SetupIntent with a Customer ID and sets `payment_method_types` to 'ideal', which includes collecting a SEPA Direct Debit mandate for iDEAL payments.

```curl
curl https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "payment_method_types[]"=ideal \
  -d customer={{CUSTOMER_ID}}
```

```cli
stripe setup_intents create  \
  -d "payment_method_types[0]"=ideal \
  --customer={{CUSTOMER_ID}}
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create({
  payment_method_types: ['ideal'],
  customer: '{{CUSTOMER_ID}}',
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")
```

--------------------------------

### Create Stripe Setup Intent with Java and Spark

Source: https://docs.stripe.com/elements/customer-sheet

This Java example demonstrates how to create a Setup Intent using the Spark framework. It retrieves an existing customer, builds SetupIntentCreateParams, and creates a SetupIntent to obtain a client secret, which is then returned as JSON.

```java
// This example sets up an endpoint using the Spark framework.

post("/create-setup-intent", (request, response) -> {
  response.type("application/json");

  // Use existing Customer
  Customer customer = {{EXISTING_CUSTOMER}};

  SetupIntentCreateParams setupIntentParams =
  SetupIntentCreateParams.builder()
    .setCustomer(customer.getId())
    .build();
  SetupIntent setupIntent = SetupIntent.create(setupIntentParams);

  Map<String, String> responseData = new HashMap();

  responseData.put("setupIntent", setupIntent.getClientSecret());

  return gson.toJson(responseData);
});
```

--------------------------------

### GET /v1/setup_intents/{setup_intent_id}

Source: https://docs.stripe.com/payments/klarna/set-up-future-payments

Retrieves the details of an existing Setup Intent. You can retrieve a Setup Intent by passing its unique ID.

```APIDOC
## GET /v1/setup_intents/{setup_intent_id}

### Description
Retrieves the details of an existing Setup Intent. You can retrieve a Setup Intent by passing its unique ID.

### Method
GET

### Endpoint
/v1/setup_intents/{setup_intent_id}

### Parameters
#### Path Parameters
- **setup_intent_id** (string) - Required - The ID of the Setup Intent to retrieve (e.g., seti_1EzVO3HssDVaQm2PJjXHmLlM).

#### Query Parameters
None

#### Request Body
None

### Request Example
N/A

### Response
#### Success Response (200)
- The response will be a SetupIntent object.

#### Response Example
{
  "id": "seti_1EzVO3HssDVaQm2PJjXHmLlM",
  "object": "setup_intent",
  "status": "succeeded",
  "client_secret": "seti_1EzVO3HssDVaQm2PJjXHmLlM_secret_XXXXXXXXXXXX",
  "payment_method_types": [
    "card"
  ]
}
```

--------------------------------

### Create Stripe Product and Price via Ruby SDK

Source: https://docs.stripe.com/development/quickstart

This Ruby script demonstrates how to programmatically create a Stripe Product and an associated Price using the Stripe Ruby SDK. It initializes the SDK with an API key and then makes two API calls, printing the resulting resource IDs.

```Ruby
require 'rubygems'
require 'stripe'
Stripe.api_key = "sk_test_YOUR_SECRET_KEY_HERE"

starter_subscription = Stripe::Product.create(
  name: 'Starter Subscription',
  description: '$12/Month subscription'
)

starter_subscription_price = Stripe::Price.create(
  currency: 'usd',
  unit_amount: 1200,
  recurring: {interval: 'month'},
  product: starter_subscription['id']
)

puts "Success! Here is your starter subscription product id: #{starter_subscription.id}"
puts "Success! Here is your starter subscription price id: #{starter_subscription_price.id}"
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/payment-link/update_api-version=2024-12-18

Endpoints related to Setup Intents, which guide you through setting up and saving customer payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a SetupIntent object. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
Not provided in source text

#### Query Parameters
Not provided in source text

#### Request Body
Not provided in source text

### Request Example
Not provided in source text

### Response
#### Success Response (200)
Not provided in source text

#### Response Example
Not provided in source text
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates the specified SetupIntent object by setting the values of the parameters passed. Any parameters not provided will be left unchanged.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters
Not provided in source text

#### Request Body
Not provided in source text

### Request Example
Not provided in source text

### Response
#### Success Response (200)
Not provided in source text

#### Response Example
Not provided in source text
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves the details of a SetupIntent that has previously been created. Supply the unique SetupIntent ID that was returned from your previous request, and Stripe will return the corresponding SetupIntent information.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
Not provided in source text

#### Request Body
Not provided in source text

### Request Example
Not provided in source text

### Response
#### Success Response (200)
Not provided in source text

#### Response Example
Not provided in source text
```

```APIDOC
## GET /v1/setup_intents

### Description
Returns a list of your SetupIntent objects. The objects are sorted in descending order by creation date, with the most recently created objects appearing first.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
Not provided in source text

#### Query Parameters
Not provided in source text

#### Request Body
Not provided in source text

### Request Example
Not provided in source text

### Response
#### Success Response (200)
Not provided in source text

#### Response Example
Not provided in source text
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent. Calling this on a SetupIntent in a terminal state (succeeded, canceled, or requires_action=unactivated) has no effect.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters
Not provided in source text

#### Request Body
Not provided in source text

### Request Example
Not provided in source text

### Response
#### Success Response (200)
Not provided in source text

#### Response Example
Not provided in source text
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent object. Upon confirmation, the SetupIntent attempts to set up a payment method for future payments.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters
Not provided in source text

#### Request Body
Not provided in source text

### Request Example
Not provided in source text

### Response
#### Success Response (200)
Not provided in source text

#### Response Example
Not provided in source text
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies a SetupIntent by confirming the microdeposits. You can use this to verify a bank account.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to verify microdeposits for.

#### Query Parameters
Not provided in source text

#### Request Body
Not provided in source text

### Request Example
Not provided in source text

### Response
#### Success Response (200)
Not provided in source text

#### Response Example
Not provided in source text
```

--------------------------------

### Set up and run local server for Stripe Issuing real-time authorizations

Source: https://docs.stripe.com/issuing/controls/real-time-authorizations/quickstart

These commands demonstrate how to set up dependencies and run a local server application to handle real-time Stripe Issuing authorizations across various programming languages. Ensure all necessary dependencies are installed before running the server.

```npm
npm install

npm start
```

```go
go run server.go
```

```python
pip3 install -r requirements.txt

export FLASK_APP=server.py
python3 -m flask run --port=4242
```

```ruby
bundle install

ruby server.rb -o 0.0.0.0
```

```php
composer install

php -S 127.0.0.1:4242 --docroot=public
```

```dotnet
dotnet restore

dotnet run
```

```java
mvn package

java -cp target/sample-jar-with-dependencies.jar com.stripe.sample.Server
```

--------------------------------

### Stripe Production Build and Run with npm

Source: https://docs.stripe.com/checkout/quickstart

These commands detail the steps for preparing and running the application in a production environment. It involves installing dependencies, building the optimized production assets, and then starting the application.

```shell
$ npm install

$ npm build

$ npm start
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/files/create_api-version=2025-10-29

Endpoints for managing Setup Intents. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## Setup Intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Endpoints
- POST /v1/setup_intents
- POST /v1/setup_intents/:id
- GET /v1/setup_intents/:id
- GET /v1/setup_intents
- POST /v1/setup_intents/:id/cancel
- POST /v1/setup_intents/:id/confirm
- POST /v1/setup_intents/:id/verify_microdeposits
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/account_sessions/create_api-version=2024-09-30

Endpoints for managing Setup Intents, which guide the process of setting up and saving a customer’s payment credentials for future payments without immediate payment collection.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent object, guiding the process of setting up and saving a customer’s payment credentials for future payments.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates an existing SetupIntent object, allowing modifications to its properties.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - Unique identifier for the SetupIntent.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves a specific SetupIntent object by its unique identifier.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - Unique identifier for the SetupIntent.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntent objects, allowing for pagination and filtering.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent object, preventing further processing.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - Unique identifier for the SetupIntent to cancel.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent object, finalizing the setup of payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - Unique identifier for the SetupIntent to confirm.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies microdeposits for a SetupIntent, typically used for bank account verification.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - Unique identifier for the SetupIntent.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/forwarding/request/object_api-version=2024-12-18

A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. Create a SetupIntent when you’re ready to collect your customer’s payment credentials. If you use the SetupIntent with a Customer, it automatically attaches the resulting payment method to that Customer after successful setup.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
No specific parameters detailed in the provided text.

```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates an existing SetupIntent object. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves a SetupIntent object by its ID. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

```

```APIDOC
## GET /v1/setup_intents

### Description
Retrieves a list of SetupIntent objects. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
No specific parameters detailed in the provided text.

```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent object. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent object. This initiates the process of setting up and saving a customer’s payment credentials for future payments.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies microdeposits for a SetupIntent. This is typically used for bank account verification.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to verify microdeposits for.

```

--------------------------------

### Integrate Stripe Connect Payments UI (HTML/JS)

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

This example demonstrates how to set up the Stripe Connect payments UI using standard HTML and JavaScript. It covers loading the Stripe Connect library, initializing the instance with a publishable key and client secret fetcher, and dynamically appending the payments component to the DOM. Ensure a server endpoint (`/account_session`) is available to provide the client secret.

```html
<head>
  <script type="module" src="index.js" defer></script>
</head>
<body>
  <h1>Payments</h1>
  <div id="container"></div>
  <div id="error" hidden>Something went wrong!</div>
</body>
```

```javascript
import {loadConnectAndInitialize} from '@stripe/connect-js';

const fetchClientSecret = async () => {
  // Fetch the AccountSession client secret
  const response = await fetch('/account_session', { method: "POST" });
  if (!response.ok) {
    // Handle errors on the client side here
    const {error} = await response.json();
    console.error('An error occurred: ', error);
    document.querySelector('#error').removeAttribute('hidden');
    return undefined;
  } else {
    const {client_secret: clientSecret} = await response.json();
    document.querySelector('#error').setAttribute('hidden', '');
    return clientSecret;
  }
}

const stripeConnectInstance = loadConnectAndInitialize({
    // This is a placeholder - it should be replaced with your publishable API key.
    // Sign in to see your own test API key embedded in code samples.
    // Don’t submit any personally identifiable information in requests made with this key.
    publishableKey: "<<YOUR_PUBLISHABLE_KEY>>",
    fetchClientSecret: fetchClientSecret,
  });
const paymentComponent = stripeConnectInstance.create("payments");
const container = document.getElementById("container");
container.appendChild(paymentComponent);
```

--------------------------------

### Create Stripe SetupIntent and Handle Backend Route for Card Wallets

Source: https://docs.stripe.com/payments/save-and-reuse-cards-only

This collection of server-side code examples demonstrates how to initialize the Stripe API, create a `SetupIntent` for a customer, and define an HTTP route (e.g., `/card-wallet`) to serve the client secret to the frontend. The `SetupIntent` is crucial for securely collecting and saving payment method details for future use.

```python
stripe.api_key = '<<YOUR_SECRET_KEY>>'

@app.route('/card-wallet')
def card_wallet():
  intent = stripe.SetupIntent.create(
    customer=customer['id']
  )
  return render_template('card_wallet.html', client_secret=intent.client_secret)

if __name__ == '__main__':
    app.run()
```

```php
<?php
  # vendor using composer
  require_once('vendor/autoload.php');

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
\Stripe\Stripe::setApiKey('<<YOUR_SECRET_KEY>>');

$intent = \Stripe\SetupIntent::create([
    'customer' => $customer->id
  ]);
?>
```

```java
import java.util.HashMap;
import java.util.Map;

import com.stripe.Stripe;
import com.stripe.model.SetupIntent;

import spark.ModelAndView;

import static spark.Spark.get;

public class StripeJavaQuickStart {
  public static void main(String[] args) {
    // Set your secret key. Remember to switch to your live secret key in production!
    // See your keys here: https://dashboard.stripe.com/apikeys
    Stripe.apiKey = "<<YOUR_SECRET_KEY>>";


    get("/card-wallet", (request, response) -> {
      Map<String, Object> params = new HashMap<>();
      params.put("customer", customer.getId());
      SetupIntent intent = SetupIntent.create(params);

      Map<String, String> map = new HashMap();
      map.put("client_secret", intent.getClientSecret());

      return new ModelAndView(map, "card_wallet.hbs");
    }, new HandlebarsTemplateEngine());
  }
}
```

```javascript

// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const express = require('express');
  const expressHandlebars = require('express-handlebars');
  const app = express();

  app.engine('.hbs', expressHandlebars({ extname: '.hbs' }));
  app.set('view engine', '.hbs');
  app.set('views', './views');

  app.get('/card-wallet', async (req, res) => {
    const intent =  await stripe.setupIntents.create({
      customer: customer.id,
    });
    res.render('card_wallet', { client_secret: intent.client_secret });
  });

  app.listen(3000, () => {
    console.log('Running on port 3000');
  });
```

```go
package main

import (
  "html/template"
  "net/http"

  stripe "github.com/stripe/stripe-go/v76.0.0"
)

type WalletData struct {
  ClientSecret string
}

func main() {
  // Set your secret key. Remember to switch to your live secret key in production!
  // See your keys here: https://dashboard.stripe.com/apikeys
  Stripe.apiKey = "<<YOUR_SECRET_KEY>>"

  cardWalletTmpl := template.Must(template.ParseFiles("views/card_wallet.html"))

  http.HandleFunc("/card-wallet", func(w http.ResponseWriter, r *http.Request) {
    params := &stripe.SetupIntentParams{
      Customer: stripe.String(customer.ID),
    }
    intent, err := setupintent.New(params)
    data := WalletData{
      ClientSecret: intent.ClientSecret,
    }
    cardWalletTmpl.Execute(w, data)
  })

  http.ListenAndServe(":3000", nil)
}
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/tax_ids/create_api-version=2024-11-20

A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow. Create a SetupIntent when you’re ready to collect your customer’s payment credentials. Don’t maintain long-lived, unconfirmed SetupIntents because they might not be valid. The SetupIntent transitions through multiple statuses as it guides you through the setup process. Successful SetupIntents result in payment credentials that are optimized for future payments. For example, cardholders in certain regions might need to be run through Strong Customer Authentication during payment method collection to streamline later off-session payments. If you use the SetupIntent with a Customer, it automatically attaches the resulting payment method to that Customer after successful setup. We recommend using SetupIntents or setup_future_usage on PaymentIntents to save payment methods to prevent saving invalid or unoptimized payment methods. By using SetupIntents, you can reduce friction for your customers, even as regulations change over time.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- **customer** (string) - Optional - The ID of the customer for whom to set up the payment method.
- **usage** (enum) - Optional - Indicates how the payment method is intended to be used in the future.

### Request Example
{
  "customer": "cus_123",
  "usage": "on_session"
}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **status** (enum) - The current status of the SetupIntent.

#### Response Example
{
  "id": "seti_123",
  "object": "setup_intent",
  "status": "requires_payment_method"
}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates an existing SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents/{id}

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters
- No query parameters.

#### Request Body
- **description** (string) - Optional - An arbitrary string attached to the object.

### Request Example
{
  "description": "Updated setup intent description"
}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **description** (string) - The updated description.

#### Response Example
{
  "id": "seti_123",
  "object": "setup_intent",
  "description": "Updated setup intent description"
}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves a SetupIntent object by its ID.

### Method
GET

### Endpoint
/v1/setup_intents/{id}

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
- No query parameters.

#### Request Body
- No request body.

### Request Example
{}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **status** (enum) - The current status of the SetupIntent.

#### Response Example
{
  "id": "seti_123",
  "object": "setup_intent",
  "status": "requires_action"
}
```

```APIDOC
## GET /v1/setup_intents

### Description
Retrieves a list of all SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- **limit** (integer) - Optional - A limit on the number of objects to be returned.
- **customer** (string) - Optional - Only return SetupIntents for the customer specified by this ID.

#### Request Body
- No request body.

### Request Example
{}

### Response
#### Success Response (200)
- **object** (string) - Always 'list'.
- **data** (array) - A list of SetupIntent objects.

#### Response Example
{
  "object": "list",
  "data": [
    {
      "id": "seti_123",
      "object": "setup_intent"
    },
    {
      "id": "seti_456",
      "object": "setup_intent"
    }
  ]
}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent. Only a SetupIntent with a status of `requires_payment_method` or `requires_confirmation` can be canceled.

### Method
POST

### Endpoint
/v1/setup_intents/{id}/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters
- No query parameters.

#### Request Body
- No request body.

### Request Example
{}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **status** (enum) - The updated status of the SetupIntent (will be 'canceled').

#### Response Example
{
  "id": "seti_123",
  "object": "setup_intent",
  "status": "canceled"
}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent. Confirmation of a SetupIntent with a payment method can be done using your publishable key on the client-side.

### Method
POST

### Endpoint
/v1/setup_intents/{id}/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters
- No query parameters.

#### Request Body
- **payment_method** (string) - Optional - ID of the payment method to attach to this SetupIntent.

### Request Example
{
  "payment_method": "pm_card_visa"
}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **status** (enum) - The updated status of the SetupIntent.

#### Response Example
{
  "id": "seti_123",
  "object": "setup_intent",
  "status": "succeeded"
}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies microdeposits for a SetupIntent. This is used for bank account verification.

### Method
POST

### Endpoint
/v1/setup_intents/{id}/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent for which to verify microdeposits.

#### Query Parameters
- No query parameters.

#### Request Body
- **amounts** (array of integers) - Required - The two microdeposit amounts in cents.

### Request Example
{
  "amounts": [32, 45]
}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **status** (enum) - The updated status of the SetupIntent.

#### Response Example
{
  "id": "seti_123",
  "object": "setup_intent",
  "status": "succeeded"
}
```

--------------------------------

### Install Backend Server Dependencies

Source: https://docs.stripe.com/payments/quickstart-checkout-sessions

These shell commands install the necessary dependencies for the Stripe example backend server across various programming languages. Each command utilizes its respective language's package manager to set up the project environment.

```python
pip3 install -r requirements.txt
```

```ruby
bundle install
```

```php
composer install
```

```csharp
dotnet restore
```

```java
mvn package
```

```nodejs
npm install
```

--------------------------------

### Create Stripe Setup Intent (Ruby)

Source: https://docs.stripe.com/billing/subscriptions/stablecoins

This Ruby example demonstrates how to initialize the Stripe client with your secret key and create a Setup Intent. The intent is configured for off-session usage with a specific customer and crypto payment method, including details for online customer acceptance.

```ruby
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create({
  confirm: true,
  return_url: 'https://www.example.com',
  usage: 'off_session',
  customer: 'cus_00000000000000',
  payment_method_data: {type: 'crypto'},
  payment_method_types: ['crypto'],
  mandate_data: {
    customer_acceptance: {
      type: 'online',
      online: {
        ip_address: '127.0.0.0',
        user_agent: 'device',
      },
    },
  },
})
```

--------------------------------

### GET /v1/payment_intents/{PAYMENTINTENT_ID}

Source: https://docs.stripe.com/payments/jp-installments/accept-a-payment

Retrieve a specific PaymentIntent object to inspect details, including the selected installment plan after payment completion. The installment plan details are typically nested within this object.

```APIDOC
## GET /v1/payment_intents/{PAYMENTINTENT_ID}

### Description
Retrieve a specific PaymentIntent object to inspect details, including the selected installment plan after payment completion. The installment plan details are typically nested within this object.

### Method
GET

### Endpoint
/v1/payment_intents/{PAYMENTINTENT_ID}

### Parameters
#### Path Parameters
- **PAYMENTINTENT_ID** (string) - Required - The ID of the PaymentIntent to retrieve.

#### Query Parameters
(None)

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
A Stripe PaymentIntent object, which includes information about the payment, its status, and potentially details regarding the installment plan chosen by the customer.

#### Response Example
```json
{
  "id": "pi_789example012",
  "object": "payment_intent",
  "amount": 10000,
  "currency": "jpy",
  "status": "succeeded",
  "payment_method_options": {
    "card": {
      "installments": {
        "plan": {
          "count": 3,
          "interval": "month",
          "type": "fixed_count"
        }
      }
    }
  }
}
```
```

--------------------------------

### List SetupIntents with various programming languages

Source: https://docs.stripe.com/api/setup_intents/list

This snippet demonstrates how to retrieve a paginated list of Stripe SetupIntents, filtered by a limit of 3, using different programming languages. It shows common SDK patterns for making API calls to list resources.

```curl
curl -G https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>" \
  -d limit=3
```

```cli
stripe setup_intents list  \
  --limit=3
```

```ruby
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intents = client.v1.setup_intents.list({limit: 3})
```

```python
client = StripeClient("<<YOUR_SECRET_KEY>>")

setup_intents = client.v1.setup_intents.list({"limit": 3})
```

```php
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$setupIntents = $stripe->setupIntents->all(['limit' => 3]);
```

```java
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SetupIntentListParams params = SetupIntentListParams.builder().setLimit(3L).build();

StripeCollection<SetupIntent> stripeCollection =
  client.v1().setupIntents().list(params);
```

```node
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntents = await stripe.setupIntents.list({
  limit: 3,
});
```

```go
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SetupIntentListParams{}
params.Limit = stripe.Int64(3)
result := sc.V1SetupIntents.List(context.TODO(), params)
```

```dotnet
var options = new SetupIntentListOptions { Limit = 3 };
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
StripeList<SetupIntent> setupIntents = service.List(options);
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/customer_portal/configurations/create_api-version=2024-10-28

A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Create a SetupIntent to guide the process of setting up and saving customer payment credentials for future use.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
None provided

#### Query Parameters
None provided

#### Request Body
None provided

### Request Example
{}

### Response
#### Success Response (200)
None provided

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Update a specific SetupIntent identified by its ID.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters
None provided

#### Request Body
None provided

### Request Example
{}

### Response
#### Success Response (200)
None provided

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieve details of a specific SetupIntent by its ID.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
None provided

#### Request Body
None provided

### Request Example
{}

### Response
#### Success Response (200)
None provided

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents

### Description
List all SetupIntents, optionally filtered.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
None provided

#### Query Parameters
None provided

#### Request Body
None provided

### Request Example
{}

### Response
#### Success Response (200)
None provided

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancel a specific SetupIntent by its ID.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters
None provided

#### Request Body
None provided

### Request Example
{}

### Response
#### Success Response (200)
None provided

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirm a specific SetupIntent, finalizing the setup of payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters
None provided

#### Request Body
None provided

### Request Example
{}

### Response
#### Success Response (200)
None provided

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verify microdeposits for a specific SetupIntent, typically used for bank account verification.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent for which to verify microdeposits.

#### Query Parameters
None provided

#### Request Body
None provided

### Request Example
{}

### Response
#### Success Response (200)
None provided

#### Response Example
{}
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/tax/calculations/create_api-version=2025-05-28

Lists all SetupIntent objects, allowing you to view a history of setup attempts.

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntent objects, allowing you to view a history of setup attempts.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters for this endpoint.

#### Query Parameters
- No query parameters provided in the source text.

#### Request Body
- No request body parameters for GET requests.

### Request Example
{
  "message": "No request body for GET request."
}

### Response
#### Success Response (200)
- No success response fields provided in the source text.

#### Response Example
{
  "message": "Response example not provided in the source text."
}
```

--------------------------------

### Create Stripe PaymentIntent and Get Client Secret (Multi-language)

Source: https://docs.stripe.com/payments/au-becs-debit/accept-a-payment

This set of code examples illustrates how to create a Stripe PaymentIntent across various programming languages. Each example initializes the Stripe API with a secret key, then constructs a PaymentIntent with parameters like amount, currency, setup future usage, customer ID, and payment method types (specifically 'au_becs_debit'). Finally, it extracts the client_secret from the created PaymentIntent, which is crucial for client-side payment processing.

```python
stripe.api_key = '<<YOUR_SECRET_KEY>>'

@app.route('/pay')
def pay():
  payment_intent = stripe.PaymentIntent.create(
    amount=1099,
    currency='aud',
    setup_future_usage='off_session',
    customer=customer['id'],
    payment_method_types=['au_becs_debit']
  )
  client_secret = payment_intent.client_secret
  # Pass the client secret to the client

if __name__ == '__main__':
  app.run()
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
\Stripe\Stripe::setApiKey('<<YOUR_SECRET_KEY>>');

# vendor using composer
require_once('vendor/autoload.php');

$payment_intent = \Stripe\PaymentIntent::create([
  'amount' => 1099,
  'currency' => 'aud',
  'setup_future_usage' => 'off_session',
  'customer' => $customer->id,
  'payment_method_types' => ['au_becs_debit'],
]);
$client_secret = $payment_intent->client_secret;
// Pass the client secret to the client
```

```java
import java.util.HashMap;
import java.util.Map;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;

public class StripeJavaQuickStart {
  public static void main(String[] args) {
    // Set your secret key. Remember to switch to your live secret key in production.
    // See your keys here: https://dashboard.stripe.com/apikeys
    Stripe.apiKey = "<<YOUR_SECRET_KEY>>";
    Map<String, Object> paymentIntentParams = new HashMap<String, Object>();
    paymentIntentParams.put("amount", 1099);
    paymentIntentParams.put("currency", "aud");
    paymentIntentParams.put("setup_future_usage", "off_session");
    paymentIntentParams.put("customer", customer.getId());
    paymentIntentParams.put("payment_method_types", Arrays.asList("au_becs_debit"));
    PaymentIntent paymentIntent = PaymentIntent.create(paymentIntentParams);
    String clientSecret = paymentIntent.getClientSecret();
    // Pass the client secret to the client
  }
}
```

```javascript
// Using Express
const express = require('express');
const app = express();
app.use(express.json());
const { resolve } = require("path");


// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const paymentIntent = await stripe.paymentIntents.create({
  amount: 1099,
  currency: 'aud',
  setup_future_usage: 'off_session',
  customer: customer.id,
  payment_method_types: ['au_becs_debit'],
});
const clientSecret = paymentIntent.client_secret;
// Pass the client secret to the client
```

```go
package main

import (
  "encoding/json"
  "log"
  "net/http"

  "github.com/stripe/stripe-go/v76.0.0"
  "github.com/stripe/stripe-go/v76.0.0/paymentintent"
)

func main() {
  // Set your secret key. Remember to switch to your live secret key in production.
  // See your keys here: https://dashboard.stripe.com/apikeys
  stripe.Key = "<<YOUR_SECRET_KEY>>"

  paymentIntentParams := &stripe.PaymentIntentParams{
    Amount: stripe.Int64(1099),
    Currency: stripe.String(string(stripe.CurrencyAUD)),
    SetupFutureUsage: stripe.String("off_session"),
    Customer: stripe.String(customer.ID),
    PaymentMethodTypes: stripe.StringSlice([]string{
      "au_becs_debit",
    }),
  }
  paymentIntent, err := paymentintent.New(paymentIntentParams)
  clientSecret := paymentIntent.ClientSecret
  // Pass the client secret to the client
}
```

```csharp
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";

using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace StripeExampleApi.Controllers
{
    [Route("/pay")]
    public class PayController : Controller
    {
        public IActionResult Index()
        {
            var service = new PaymentIntentService();
            var options = new PaymentIntentCreateOptions
            {
              Amount = 1099,
              Currency = "aud",
              SetupFutureUsage = "off_session",
              Customer = ""{{CUSTOMER_ID}}"",
              PaymentMethodTypes = new List<string>
              {
                "au_becs_debit",
              },
            };
            var paymentIntent = service.Create(options);

            var clientSecret = paymentIntent.ClientSecret;
            // Pass the client secret to the client
        }
    }
}
```

--------------------------------

### GET /v1/setup_intents/{SETUP_INTENT_ID}

Source: https://docs.stripe.com/payments/ideal/set-up-payment

Retrieves the details of a Setup Intent. You can expand related objects like the latest attempt to get more detailed information.

```APIDOC
## GET /v1/setup_intents/{SETUP_INTENT_ID}

### Description
Retrieves the details of a Setup Intent by its ID. It allows for expanding related objects to include additional information in the response.

### Method
GET

### Endpoint
/v1/setup_intents/{SETUP_INTENT_ID}

### Parameters
#### Path Parameters
- **SETUP_INTENT_ID** (string) - Required - The unique identifier of the Setup Intent to retrieve.

#### Query Parameters
- **expand** (array<string>) - Optional - A list of fields to expand in the response. E.g., `latest_attempt`.

### Request Example
(Not applicable for this GET request)

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **object** (string) - String representing the object’s type. Value is `setup_intent`.
- **status** (string) - The current status of the SetupIntent.
- **latest_attempt** (object) - Details of the latest Setup Attempt (if expanded).

#### Response Example
```json
{
  "id": "seti_12345",
  "object": "setup_intent",
  "status": "succeeded",
  "latest_attempt": {
    "id": "setatt_abcdef",
    "object": "setup_attempt",
    "status": "succeeded",
    "setup_intent": "seti_12345"
  }
}
```
```

--------------------------------

### Install Ruby Project Dependencies with Bundler

Source: https://docs.stripe.com/development/quickstart

Execute this command to install all gems specified in your project's Gemfile, including the Stripe gem, from their defined sources.

```Command Line
bundle install
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/api/terminal/configuration/update_api-version=2025-01-27

Creates a SetupIntent, which guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None provided.

### Request Example
{}

### Response
#### Success Response (200)
None provided.

#### Response Example
{}
```

--------------------------------

### Setup Stripe Webhook Endpoint in Ruby (Sinatra)

Source: https://docs.stripe.com/connect/webhooks

This Ruby code snippet shows the initial setup for a Stripe webhook endpoint using the Sinatra framework. It sets the API key and defines the server port. This example only provides the basic setup and does not include the full webhook handling logic.

```Ruby
# Using Sinatra.
require 'sinatra'
require 'stripe'

set :port, 4242

# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
Stripe.api_key = '<<YOUR_SECRET_KEY>>'

# If you're testing your webhook locally with the Stripe CLI, you
# can find the endpoint's secret by running `stripe listen`
# Otherwise, find your endpoint's secret in your webhook settings in

```

--------------------------------

### POST /v1/setup_intents - Create a SetupIntent

Source: https://docs.stripe.com/billing/subscriptions/paypal

This endpoint allows you to create a SetupIntent object on your server. A SetupIntent tracks the steps to set up your customer's payment method for future payments. This example demonstrates how to configure it for PayPal.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a SetupIntent object, which represents your intent and tracks the steps to set up your customer’s payment method for future payments. This example specifically configures the SetupIntent for PayPal payments, associating it with a customer.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Request Body
- **customer** (string) - Required - The ID of the Customer object to associate this SetupIntent with.
- **payment_method_types[]** (array of strings) - Required - A list of the payment method types that this SetupIntent is intended to set up. For this example, it's `paypal`.
- **payment_method_data[type]** (string) - Required - Details about the payment method to set up. For this example, the type is `paypal`.

### Request Example
```json
{
  "customer": "{{CUSTOMER_ID}}",
  "payment_method_types": [
    "paypal"
  ],
  "payment_method_data": {
    "type": "paypal"
  }
}
```

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **object** (string) - String representing the object’s type. Value is `setup_intent`.
- **client_secret** (string) - The client secret of this SetupIntent. Used for client-side confirmation.
- **status** (string) - Status of the SetupIntent, one of `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `canceled`, `succeeded`.

#### Response Example
```json
{
  "id": "seti_1Glz572eZvKYlo2CLm1s7f4F",
  "object": "setup_intent",
  "amount": null,
  "canceled_at": null,
  "cancellation_reason": null,
  "client_secret": "seti_1Glz572eZvKYlo2CLm1s7f4F_secret_G0s567...0T",
  "created": 1678886400,
  "customer": "cus_N7Ld1y8t3bEw5s",
  "description": null,
  "last_setup_error": null,
  "latest_attempt": null,
  "livemode": false,
  "mandate": null,
  "metadata": {},
  "next_action": null,
  "on_behalf_of": null,
  "payment_method": null,
  "payment_method_options": {
    "card": {
      "request_three_d_secure": "automatic"
    }
  },
  "payment_method_types": [
    "paypal"
  ],
  "single_use_mandate": null,
  "status": "requires_payment_method",
  "usage": "on_session"
}
```
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/payment_methods/update_api-version=2025-01-27

The Setup Intent API guides you through the process of setting up and saving a customer’s payment credentials for future payments without immediate collection.

```APIDOC
## POST /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to verify microdeposits for.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Install Stripe API Client Libraries

Source: https://docs.stripe.com/payments/sofort/set-up-payment

These examples provide instructions for installing the official Stripe API client libraries across different programming languages. They cover using package managers like RubyGems, pip for Python, and Composer for PHP, as well as specifying dependencies in project configuration files.

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

```bash
# Install through pip
pip3 install --upgrade stripe
```

```bash
# Or find the Stripe package on http://pypi.python.org/pypi/stripe/
```

```python
# Find the version you want to pin:
# https://github.com/stripe/stripe-python/blob/master/CHANGELOG.md
# Specify that version in your requirements.txt file
stripe>=5.0.0
```

```bash
# Install the PHP library with Composer
composer require stripe/stripe-php
```

```bash
# Or download the source directly: https://github.com/stripe/stripe-php/releases
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/v2/core/events/event-types_api-version=2025-04-30

The Setup Intents API guides you through setting up and saving a customer's payment credentials for future payments without immediately collecting funds.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- **customer** (string) - Optional - The ID of the customer this SetupIntent belongs to.
- **payment_method_types** (array) - Optional - The list of payment method types that this SetupIntent is allowed to use.

### Request Example
{
  "customer": "cus_123",
  "payment_method_types": ["card"]
}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the SetupIntent.
- **object** (string) - The object type, always 'setup_intent'.
- **status** (string) - The status of the SetupIntent.

#### Response Example
{
  "id": "seti_12345",
  "object": "setup_intent",
  "status": "requires_payment_method"
}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates an existing SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters
- No query parameters.

#### Request Body
- **description** (string) - Optional - An arbitrary string attached to the object.

### Request Example
{
  "description": "Updated setup intent for subscription"
}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the SetupIntent.
- **object** (string) - The object type, always 'setup_intent'.
- **status** (string) - The updated status of the SetupIntent.

#### Response Example
{
  "id": "seti_12345",
  "object": "setup_intent",
  "status": "requires_confirmation"
}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves a specific SetupIntent object by its ID.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
- No query parameters.

#### Request Body
- No request body.

### Request Example
(No request body for GET)

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the SetupIntent.
- **object** (string) - The object type, always 'setup_intent'.
- **status** (string) - The current status of the SetupIntent.

#### Response Example
{
  "id": "seti_12345",
  "object": "setup_intent",
  "status": "succeeded"
}
```

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntent objects.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- **limit** (integer) - Optional - A limit on the number of objects to be returned.
- **created** (integer) - Optional - A filter on the list based on the object's 'created' field.

#### Request Body
- No request body.

### Request Example
(No request body for GET)

### Response
#### Success Response (200)
- **object** (string) - The object type, always 'list'.
- **data** (array) - A list of SetupIntent objects.

#### Response Example
{
  "object": "list",
  "data": [
    {
      "id": "seti_12345",
      "object": "setup_intent",
      "status": "succeeded"
    },
    {
      "id": "seti_67890",
      "object": "setup_intent",
      "status": "requires_action"
    }
  ]
}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

###
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/setup_intents/list

Retrieves a paginated list of SetupIntents, allowing filtering by creation date, customer, payment method, and other criteria. Useful for viewing all SetupIntents or a specific subset.

```APIDOC
## GET /v1/setup_intents

### Description
This endpoint retrieves a list of SetupIntents. It allows for pagination and filtering based on various criteria such as creation date, customer, or associated payment method.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Query Parameters
- **attach_to_self** (boolean) - Optional - If present, the SetupIntent’s payment method will be attached to the in-context Stripe Account. Cannot be set to true when setting up a PaymentMethod for a Customer.
- **created** (object) - Optional - A filter on the list, based on the object `created` field. Can be a Unix timestamp or an object with comparison operators.
  - **created.gt** (integer) - Optional - Minimum value to filter by (exclusive)
  - **created.gte** (integer) - Optional - Minimum value to filter by (inclusive)
  - **created.lt** (integer) - Optional - Maximum value to filter by (exclusive)
  - **created.lte** (integer) - Optional - Maximum value to filter by (inclusive)
- **customer** (string) - Optional - Only return SetupIntents for the customer specified by this customer ID.
- **ending_before** (string) - Optional - A cursor for use in pagination, defining the object ID to fetch the previous page of the list.
- **limit** (integer) - Optional - A limit on the number of objects to be returned. Range: 1 to 100. Default: 10.
- **payment_method** (string) - Optional - Only return SetupIntents that associate with the specified payment method.
- **starting_after** (string) - Optional - A cursor for use in pagination, defining the object ID to fetch the next page of the list.

### Response
#### Success Response (200)
- **object** (string) - Value is "list".
- **url** (string) - The URL of the API endpoint.
- **has_more** (boolean) - Indicates if there are more SetupIntents available.
- **data** (array of object) - An array of SetupIntent objects.
  - **id** (string) - Unique identifier for the SetupIntent.
  - **object** (string) - Type of the object, value is "setup_intent".
  - **client_secret** (string) - The client secret of the SetupIntent.
  - **created** (integer) - Time at which the object was created.
  - **status** (string) - Status of the SetupIntent (e.g., "requires_payment_method").
  - *Additional fields specific to the SetupIntent object are included.*

#### Response Example
```json
{
  "object": "list",
  "url": "/v1/setup_intents",
  "has_more": false,
  "data": [
    {
      "id": "seti_1Mm8s8LkdIwHu7ix0OXBfTRG",
      "object": "setup_intent",
      "application": null,
      "cancellation_reason": null,
      "client_secret": "seti_1Mm8s8LkdIwHu7ix0OXBfTRG_secret_NXDICkPqPeiBTAFqWmkbff09lRmSVXe",
      "created": 1678942624,
      "customer": null,
      "description": null,
      "flow_directions": null,
      "last_setup_error": null,
      "latest_attempt": null,
      "livemode": false,
      "mandate": null,
      "metadata": {},
      "next_action": null,
      "on_behalf_of": null,
      "payment_method": null,
      "payment_method_options": {
        "card": {
          "mandate_options": null,
          "network": null,
          "request_three_d_secure": "automatic"
        }
      },
      "payment_method_types": [
        "card"
      ],
      "single_use_mandate": null,
      "status": "requires_payment_method",
      "usage": "off_session"
    }
  ]
}
```
```

--------------------------------

### GET /v1/sigma/scheduled

Source: https://docs.stripe.com/docs/api/subscriptions

No description

--------------------------------

### Create Stripe Invoice with Installments

Source: https://docs.stripe.com/payments/jp-installments/accept-a-payment

These examples demonstrate how to create a new Stripe invoice configured for installment payments. This requires setting the `collection_method` to `send_invoice`, defining a `days_until_due`, and explicitly enabling card installments. A valid customer ID and API key are necessary for this operation.

```curl
curl https://api.stripe.com/v1/invoices \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer="{{CUSTOMER_ID}}" \
  -d collection_method=send_invoice \
  -d days_until_due=30 \
  -d pending_invoice_items_behavior=include \
  -d "payment_settings[payment_method_options][card][installments][enabled]"=true
```

```cli
stripe invoices create  \
  --customer="{{CUSTOMER_ID}}" \
  --collection-method=send_invoice \
  --days-until-due=30 \
  --pending-invoice-items-behavior=include \
  -d "payment_settings[payment_method_options][card][installments][enabled]"=true
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

invoice = client.v1.invoices.create({
  customer: '{{CUSTOMER_ID}}',
  collection_method: 'send_invoice',
  days_until_due: 30,
  pending_invoice_items_behavior: 'include',
  payment_settings: {payment_method_options: {card: {installments: {enabled: true}}}},
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/customer_portal/configurations/update_api-version=2025-09-30

Endpoints related to Setup Intents, which guide you through setting up and saving customer payment credentials for future payments without immediate collection.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a SetupIntent when you're ready to collect your customer's payment credentials. Do not maintain long-lived, unconfirmed SetupIntents as they might not be valid.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Allows for operations on a specific SetupIntent identified by its ID. The exact operation (e.g., update) is not specified by the provided text, but it's a POST request to an existing SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to operate on.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves the details of a specific SetupIntent identified by its ID.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents

### Description
Retrieves a list of all SetupIntents. Allows for listing existing SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent identified by its ID. A SetupIntent can be canceled if it has not succeeded yet.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent identified by its ID. This typically involves collecting payment method details.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies microdeposits for a SetupIntent, used for certain payment method types that require bank account verification.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent for which to verify microdeposits.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Install Stripe API Client Library

Source: https://docs.stripe.com/payments/sequra/accept-a-payment

These snippets provide instructions and commands to install the Stripe API client library in various programming languages and build systems. This includes adding dependencies for Java (Gradle and Maven), installing packages for Node.js (npm), configuring Go modules and fetching the Go client, and integrating for .NET using dotnet or NuGet.

```gradle
/*
  For Gradle, add the following dependency to your build.gradle and replace with
  the version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
*/
implementation "com.stripe:stripe-java:30.0.0"
```

```xml
<!--
  For Maven, add the following dependency to your POM and replace with the
  version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
-->
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>30.0.0</version>
</dependency>
```

```bash
# Install with npm
npm install stripe --save
```

```bash
# Make sure your project is using Go Modules
go mod init
# Install stripe-go
go get -u github.com/stripe/stripe-go/v83
```

```go
// Then import the package
import (
  "github.com/stripe/stripe-go/v83"
)
```

```bash
# Install with dotnet
dotnet add package Stripe.net
dotnet restore
```

```bash
# Or install with NuGet
Install-Package Stripe.net
```

--------------------------------

### Configure Stripe Account Creation Parameters in Go

Source: https://docs.stripe.com/connect/onboarding/quickstart

This Go example demonstrates various parameters that can be used when creating a new Stripe connected account. It shows how to set capabilities (like card payments and transfers), controller settings for Stripe Dashboard type, fees, losses, and the account's country.

```go
account, err := account.New(&stripe.AccountParams{})
  account, err := account.New(&stripe.AccountParams{
    Controller: &stripe.AccountControllerParams{
      StripeDashboard: &stripe.AccountControllerStripeDashboardParams{
        Type: stripe.String("none"),
      },
      StripeDashboard: &stripe.AccountControllerStripeDashboardParams{
        Type: stripe.String("express"),
      },
      Fees: &stripe.AccountControllerFeesParams{
        Payer: stripe.String("application"),
      },
      Losses: &stripe.AccountControllerLossesParams{
        Payments: stripe.String("application"),
      },
      RequirementCollection: stripe.String("application"),
      Losses: &stripe.AccountControllerLossesParams{
        Payments: stripe.String("application"),
      },
    },
    Capabilities: &stripe.AccountCapabilitiesParams{
      CardPayments: &stripe.AccountCapabilitiesCardPaymentsParams{
        Requested: stripe.Bool(true),
      },
      Transfers: &stripe.AccountCapabilitiesTransfersParams{
        Requested: stripe.Bool(true),
      },
    },
    Capabilities: &stripe.AccountCapabilitiesParams{
      Transfers: &stripe.AccountCapabilitiesTransfersParams{
        Requested: stripe.Bool(true),
      },
    },
    Country: stripe.String("US"),
  })
```

--------------------------------

### Link External Bank Account via Setup Intent

Source: https://docs.stripe.com/baas/start-integration/integration-guides/embedded-finance

These examples show how to create a Stripe SetupIntent to link an external US bank account, enabling both inbound and outbound money transfers. The SetupIntent specifies payment method data, customer acceptance mandates, and associates the account with `self` for transfers by the account owner.

```curl
curl https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -H "Stripe-Account: {{CONNECTEDACCOUNT_ID}}" \
  -d attach_to_self=true \
  -d "flow_directions[]"=inbound \
  -d "flow_directions[]"=outbound \
  -d "payment_method_types[]"=us_bank_account \
  -d "payment_method_data[type]"=us_bank_account \
  -d "payment_method_data[us_bank_account][routing_number]"=110000000 \
  -d "payment_method_data[us_bank_account][account_number]"=000123456789 \
  -d "payment_method_data[us_bank_account][account_holder_type]"=company \
  -d "payment_method_data[billing_details][name]"="Company Corp" \
  -d confirm=true \
  -d "mandate_data[customer_acceptance][type]"=online \
  -d "mandate_data[customer_acceptance][online][ip_address]"="123.123.123.123"
```

```cli
stripe setup_intents create  \
  --stripe-account {{CONNECTEDACCOUNT_ID}} \
  --attach-to-self=true \
  -d "flow_directions[0]"=inbound \
  -d "flow_directions[1]"=outbound \
  -d "payment_method_types[0]"=us_bank_account \
  -d "payment_method_data[type]"=us_bank_account \
  -d "payment_method_data[us_bank_account][routing_number]"=110000000 \
  -d "payment_method_data[us_bank_account][account_number]"=000123456789 \
  -d "payment_method_data[us_bank_account][account_holder_type]"=company \
  -d "payment_method_data[billing_details][name]"="Company Corp" \
  --confirm=true \
  -d "mandate_data[customer_acceptance][type]"=online \
  -d "mandate_data[customer_acceptance][online][ip_address]"="123.123.123.123"
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create(
  {
    attach_to_self: true,
    flow_directions: ['inbound', 'outbound'],
    payment_method_types: ['us_bank_account'],
    payment_method_data: {
      type: 'us_bank_account',
      us_bank_account: {
        routing_number: '110000000',
        account_number: '000123456789',
        account_holder_type: 'company',
      },
      billing_details: {name: 'Company Corp'},
    },
    confirm: true,
    mandate_data: {
      customer_acceptance: {
        type: 'online',
        online: {ip_address: '123.123.123.123'},
      },
    },
  },
  {stripe_account: '{{CONNECTEDACCOUNT_ID}}'},
)
```

--------------------------------

### Install Stripe Client Library for Java

Source: https://docs.stripe.com/billing/subscriptions/ideal

Install the Stripe client library for Java by adding the dependency to your build configuration. Examples are provided for Gradle and Maven, specifying `stripe-java` as the artifact. This library facilitates Stripe API calls in Java applications.

```java
implementation "com.stripe:stripe-java:30.0.0"
```

```xml
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>30.0.0</version>
</dependency>
```

--------------------------------

### Set up Stripe Connect App Install Component with Vanilla JavaScript

Source: https://docs.stripe.com/connect/supported-embedded-components/app-install

This example shows how to embed and configure the Stripe Connect App Install component using plain JavaScript. It includes the necessary HTML container, instantiates an `app-install` component, sets its target app, and attaches event handlers for when the install state is fetched initially and when it changes, logging the app ID and state to the console.

```js
// index.html
<div id="app-install-container"></div>

// index.js

// Do something when install state fetched on render
const handleAppInstallFetched = (response) => {
  console.log(`Install state fetched for app  ${response.appId} to ${response.state}`);
};

// Do something when install state changes
const handleAppInstallChanged = (response) => {
  console.log(`Install state changed for app  ${response.appId} to ${response.state}`);
};


const container = document.getElementById('app-install-container');
const appInstall = stripeConnectInstance.create('app-install');
appInstall.setApp('{{APP_ID}}');
appInstall.setOnAppInstallStateFetched(handleAppInstallFetched);
appInstall.setOnAppInstallStateChanged(handleAppInstallChanged);
container.appendChild(appInstall);
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/payments/acss-debit/set-up-payment

This endpoint retrieves a list of SetupIntents associated with a specific customer. It allows you to view all payment method setups that have been initiated or completed for a customer.

```APIDOC
## GET /v1/setup_intents

### Description
This endpoint retrieves a list of SetupIntents for a given customer. This is useful for managing customer payment method setups.

### Method
GET

### Endpoint
`/v1/setup_intents`

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- **customer** (string) - Required - The ID of the customer whose SetupIntents are to be listed.

#### Request Body
- No request body.

### Request Example
GET /v1/setup_intents?customer={{CUSTOMER_ID}}

### Response
#### Success Response (200)
- **object** (string) - Always `list`.
- **data** (array of objects) - A list containing SetupIntent objects.
- **has_more** (boolean) - True if there are more elements available.
- **url** (string) - The URL for the current API resource.

#### Response Example
```json
{
  "object": "list",
  "data": [
    {
      "id": "seti_123abcDEF",
      "object": "setup_intent",
      "amount": null,
      "currency": null,
      "customer": "cus_G5J7pE2sC3m",
      "status": "succeeded",
      "usage": "off_session",
      "payment_method": "pm_123xyZ"
    }
  ],
  "has_more": false,
  "url": "/v1/setup_intents"
}
```
```

--------------------------------

### GET /v1/setup_intents/{SETUP_INTENT_ID}

Source: https://docs.stripe.com/payments/save-and-reuse_platform=web

Retrieve a SetupIntent object to get its status and associated payment method ID. This is typically done after a `checkout.session.completed` webhook event to finalize the setup process.

```APIDOC
## GET /v1/setup_intents/{SETUP_INTENT_ID}

### Description
After a customer successfully completes their Checkout Session, handle the `checkout.session.completed` webhook. Retrieve the Session object, get the `setup_intent` key, and then use the SetupIntent ID to retrieve the SetupIntent object. The returned object contains a `payment_method` ID.

### Method
GET

### Endpoint
/v1/setup_intents/{SETUP_INTENT_ID}

### Parameters
#### Path Parameters
- **SETUP_INTENT_ID** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
(None)

#### Request Body
(None)

### Request Example
(No request body for GET)

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **object** (string) - String representing the object’s type. Value is `setup_intent`.
- **payment_method** (string) - The ID of the PaymentMethod associated with this SetupIntent.
- **status** (string) - Status of this SetupIntent, e.g., `succeeded`.

#### Response Example
```json
{
  "id": "seti_example",
  "object": "setup_intent",
  "status": "succeeded",
  "payment_method": "pm_example",
  "customer": "cus_example"
}
```
```

--------------------------------

### Install Stripe Python Client Library

Source: https://docs.stripe.com/billing/subscriptions/build-subscriptions

This snippet shows how to install the Stripe Python client library using pip. It also includes an example of how to pin a specific version in your requirements.txt file.

```bash
pip3 install --upgrade stripe
```

```python
# Find the version you want to pin:
# https://github.com/stripe/stripe-python/blob/master/CHANGELOG.md
# Specify that version in your requirements.txt file
stripe>=5.0.0
```

--------------------------------

### Create Stripe Customer and Setup Intent using cURL

Source: https://docs.stripe.com/elements/customer-sheet

This example shows how to use cURL to create a new Stripe Customer and then a Setup Intent. The Setup Intent is linked to the created customer, facilitating the collection of payment method details for future use. Replace `YOUR_SECRET_KEY` and `CUSTOMER_ID` placeholders.

```bash
# Create a Customer (skip this and get the existing Customer ID if this is a returning customer)
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST"

curl https://api.stripe.com/v1/setup_intents \
  -u <<YOUR_SECRET_KEY>>: \
  -d "customer"="{{CUSTOMER_ID}}" \
```

--------------------------------

### Stripe Terminal: Collect & Confirm Setup Intent (Java, Old)

Source: https://docs.stripe.com/terminal/references/sdk-migration-guide

This Java code demonstrates the original two-step process for handling a Stripe Setup Intent. It first collects the payment method and then confirms the setup intent using nested callbacks for asynchronous operations, showcasing the 'before' state of the API.

```java
// Step 1: Collect setup intent payment method
Terminal.getInstance().collectSetupIntentPaymentMethod(
    setupIntent,
    AllowRedisplay.ALWAYS,
    new SetupIntentCallback() {
        @Override
        public void onSuccess(@NotNull SetupIntent setupIntent) {
            // Step 2: Confirm the setup intent
            Terminal.getInstance().confirmSetupIntent(setupIntent, new SetupIntentCallback() {
                @Override
                public void onSuccess(@NotNull SetupIntent confirmedSetupIntent) {
                    // Setup intent successful
                }
                @Override
                public void onFailure(@NotNull TerminalException e) {
                    // Setup intent confirmation failed
                }
            });
        }
        @Override
        public void onFailure(@NotNull TerminalException e) {
            // Setup intent collection failed
        }
    }
);
```

--------------------------------

### Display Stripe Connect Account Onboarding UI (JavaScript, React)

Source: https://docs.stripe.com/connect/api-onboarding

These snippets demonstrate how to integrate and display the Stripe Connect account onboarding user interface for new users. The JavaScript example initializes an `account-onboarding` element and appends it to a container, while the React example uses the `ConnectAccountOnboarding` component. Both include an `onExit` callback to handle user completion or exit of the onboarding flow, with optional configurations for policy URLs and collection options commented out.

```JavaScript
// Include this element in your HTML
const accountOnboarding = stripeConnectInstance.create('account-onboarding');
accountOnboarding.setOnExit(() => {
  console.log('User exited the onboarding flow');
});
container.appendChild(accountOnboarding);

// Optional: make sure to follow our policy instructions above
// accountOnboarding.setFullTermsOfServiceUrl('{{URL}}')
// accountOnboarding.setRecipientTermsOfServiceUrl('{{URL}}')
// accountOnboarding.setPrivacyPolicyUrl('{{URL}}')
// accountOnboarding.setCollectionOptions({
//   fields: 'eventually_due',
//   futureRequirements: 'include',
// })
// accountOnboarding.setOnStepChange((stepChange) => {
//   console.log(`User entered: ${stepChange.step}`);
// });
```

```JSX
import * as React from "react";
import { ConnectAccountOnboarding, ConnectComponentsProvider } from "@stripe/react-connect-js";

const AccountOnboardingUI = () => {
  return (
    <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
      <ConnectAccountOnboarding
          onExit={() => {
            console.log("The account has exited onboarding");
          }}
          // Optional: make sure to follow our policy instructions above
          // fullTermsOfServiceUrl="{{URL}}"
          // recipientTermsOfServiceUrl="{{URL}}"
          // privacyPolicyUrl="{{URL}}"
          // collectionOptions={{
          //   fields: 'eventually_due',
          //   futureRequirements: 'include',
          // }}
          // onStepChange={(stepChange) => {
          //   console.log(`User entered: ${stepChange.step}`);
          // }}
        />
    </ConnectComponentsProvider>
  );
}
```

--------------------------------

### Create Stripe Checkout Session in Setup Mode

Source: https://docs.stripe.com/payments/sepa-debit/accept-a-payment

These examples illustrate how to create a Stripe Checkout Session configured in 'setup' mode. This mode is typically used for collecting and saving a customer's payment method details for future use, rather than making an immediate charge. The examples specify 'sepa_debit' as the payment method type and include a reference prefix for SEPA Debit mandate options. Note: The Python example provided is truncated and only shows client initialization.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d mode=setup \
  -d "payment_method_types[]"=sepa_debit \
  -d "payment_method_options[sepa_debit][mandate_options][reference_prefix]"=EX4MPL3-
```

```cli
stripe checkout sessions create  \
  --mode=setup \
  -d "payment_method_types[0]"=sepa_debit \
  -d "payment_method_options[sepa_debit][mandate_options][reference_prefix]"=EX4MPL3-
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

session = client.v1.checkout.sessions.create({
  mode: 'setup',
  payment_method_types: ['sepa_debit'],
  payment_method_options: {sepa_debit: {mandate_options: {reference_prefix: 'EX4MPL3-'}}},
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")
```

--------------------------------

### GET /v1/setup_intents/{SETUP_INTENT_ID}

Source: https://docs.stripe.com/payments/sofort/set-up-payment

Retrieves the details of an existing SetupIntent. You can expand the 'latest_attempt' object to get more information about the most recent setup attempt.

```APIDOC
## GET /v1/setup_intents/{SETUP_INTENT_ID}

### Description
Retrieves the details of an existing SetupIntent using its unique ID. This operation supports expanding related objects, such as the `latest_attempt`, to provide more comprehensive information in the response.

### Method
GET

### Endpoint
/v1/setup_intents/{SETUP_INTENT_ID}

### Parameters
#### Path Parameters
- **SETUP_INTENT_ID** (string) - Required - The unique identifier of the SetupIntent to retrieve.

#### Query Parameters
- **expand[]** (array of strings) - Optional - A list of objects to expand in the response. Example: `latest_attempt`.

#### Request Body
Not applicable

### Request Example
```json
{}
```

### Response
#### Success Response (200)
A SetupIntent object containing its details and potentially expanded objects.
- **id** (string) - Unique identifier for the object.
- **object** (string) - String representing the object's type. Value is `setup_intent`.
- **status** (string) - Status of the SetupIntent.
- **latest_attempt** (object) - (Expanded if requested) The latest SetupAttempt object associated with this SetupIntent.

#### Response Example
```json
{
  "id": "seti_12345",
  "object": "setup_intent",
  "status": "succeeded",
  "customer": "cus_abcde",
  "latest_attempt": {
    "id": "setatt_67890",
    "object": "setup_attempt",
    "status": "succeeded"
  }
}
```
```

--------------------------------

### Install Stripe Server-side Libraries

Source: https://docs.stripe.com/payments/kr-card/accept-a-payment

These examples show how to install the Stripe client libraries for various server-side programming languages using their respective package managers. Always refer to the official documentation for the latest versions and installation methods.

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

```bash
# Install through pip
pip3 install --upgrade stripe
```

```python
# Find the version you want to pin:
# https://github.com/stripe/stripe-python/blob/master/CHANGELOG.md
# Specify that version in your requirements.txt file
stripe>=5.0.0
```

```bash
# Install the PHP library with Composer
composer require stripe/stripe-php
```

```gradle
/*
  For Gradle, add the following dependency to your build.gradle and replace with
  the version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
*/
implementation "com.stripe:stripe-java:30.0.0"
```

```xml
<!--
  For Maven, add the following dependency to your POM and replace with the
  version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
-->
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>30.0.0</version>
</dependency>
```

--------------------------------

### Create Stripe Checkout Session across Languages

Source: https://docs.stripe.com/payments/checkout/migration

These snippets demonstrate how to create a Stripe Checkout Session, which redirects customers to a hosted payment page. They configure the session for 'setup' mode, specify currency, and set a `success_url` for post-payment redirection. Examples are provided for cURL, Stripe CLI, Ruby, and Python, requiring a secret API key.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d mode=setup \
  -d currency=usd \
  --data-urlencode success_url="https://example.com/success?session_id={CHECKOUT_SESSION_ID}"
```

```cli
stripe checkout sessions create  \
  --mode=setup \
  --currency=usd \
  --success-url="https://example.com/success?session_id={CHECKOUT_SESSION_ID}"
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

session = client.v1.checkout.sessions.create({
  mode: 'setup',
  currency: 'usd',
  success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")
```

--------------------------------

### Initialize Stripe Java SDK

Source: https://docs.stripe.com/sdks/server-side

Example of initializing the Stripe Java SDK by importing the `StripeClient` and instantiating it with your secret API key.

```java
import com.stripe.StripeClient;
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/tax/registrations_api-version=2025-10-29

Endpoints for managing Setup Intents, which guide the process of setting up and saving customer payment credentials for future payments without immediately collecting payment.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent object, guiding the process of setting up and saving a customer's payment credentials for future payments.

### Method
POST

### Endpoint
/v1/setup_intents
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates the specified SetupIntent object, allowing modification of its properties.

### Method
POST

### Endpoint
/v1/setup_intents/:id
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves the details of a specific SetupIntent.

### Method
GET

### Endpoint
/v1/setup_intents/:id
```

```APIDOC
## GET /v1/setup_intents

### Description
Returns a list of your SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent that hasn't been confirmed yet.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent, which means all payment method details and other required information have been collected.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies microdeposits for a SetupIntent, typically used for bank account verification.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits
```

--------------------------------

### Create Stripe SetupIntent (Server-side, Multi-language)

Source: https://docs.stripe.com/payments/link/save-and-reuse

These examples illustrate how to create a SetupIntent on your server. A SetupIntent captures customer payment method details for future use. The snippets show how to specify the customer ID and desired payment method types like 'card' and 'link', using cURL, Stripe CLI, and Ruby.

```curl
curl https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer={{CUSTOMER_ID}} \
  -d "payment_method_types[]"=card \
  -d "payment_method_types[]"=link
```

```cli
stripe setup_intents create  \
  --customer={{CUSTOMER_ID}} \
  -d "payment_method_types[0]"=card \
  -d "payment_method_types[1]"=link
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create({
  customer: '{{CUSTOMER_ID}}',
  payment_method_types: ['card', 'link'],
})
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/payment_intents/create_api-version=2025-01-27

Lists all SetupIntent objects, allowing retrieval of multiple setup intents.

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntent objects, allowing retrieval of multiple setup intents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
None.

### Request Example
{
  "example": "No specific request body parameters provided in documentation."
}

### Response
#### Success Response (200)
- **data** (array) - A list containing SetupIntent objects.
- **has_more** (boolean) - True if there are more objects in the list.
- **object** (string) - Value is "list".

#### Response Example
{
  "example": "No specific response body example provided in documentation."
}
```

--------------------------------

### Install Stripe iOS SDK with CocoaPods

Source: https://docs.stripe.com/payments/ach-direct-debit/set-up-payment

This guide provides commands and `Podfile` content for installing the Stripe iOS SDK using CocoaPods. It includes steps for initializing a Podfile, adding the necessary Stripe dependencies (`Stripe` and `StripeFinancialConnections`), and performing the installation and subsequent updates. Remember to open the `.xcworkspace` file after installation.

```bash
pod init
pod install
pod update Stripe
pod update StripeFinancialConnections
```

```podfile
pod 'Stripe'
pod 'StripeFinancialConnections'
```

--------------------------------

### Implement Stripe Payment Sheet backend endpoint

Source: https://docs.stripe.com/payments/mobile/set-up-future-payments

These code examples demonstrate how to create a backend endpoint that generates the necessary components for initializing the Stripe Payment Sheet. This includes creating a Stripe Customer, an Ephemeral Key, and a Setup Intent, returning their respective client secrets and IDs. Each example uses its language's official Stripe library and is typically part of a web framework.

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";

[HttpPost("payment-sheet")]
public ActionResult<PaymentSheetCreateResponse> CreatePaymentSheet([FromBody] CreatePaymentSheetRequest req)
{
  // Use an existing Customer ID if this is a returning customer.
  var customerOptions = new CustomerCreateOptions();
  var customerService = new CustomerService();
  var requestOptions =
{
    StripeAccount = "{{CONNECTED_ACCOUNT_ID}}"
};
  var customer = customerService.Create(customerOptions, requestOptions);
  var ephemeralKeyOptions = new EphemeralKeyCreateOptions
  {
    Customer = customer.Id,
    StipeAccount = "{{CONNECTED_ACCOUNT_ID}}",
    StripeVersion = "2025-10-29.clover",
  };
  var ephemeralKeyService = new EphemeralKeyService();
  var ephemeralKey = ephemeralKeyService.Create(ephemeralKeyOptions);

  var setupIntentOptions = new SetupIntentCreateOptions
  {
    Customer = customer.Id,
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter
    // is optional because Stripe enables its functionality by default.
    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
    {
      Enabled = true,
    },
  };
  var setupIntentService = new SetupIntentService();
  SetupIntent setupIntent = setupIntentService.Create(setupIntentOptions);

  return new PaymentSheetCreateResponse
  {
    SetupIntent = setupIntent.ClientSecret,
    EphemeralKey = ephemeralKey.Secret,

    Customer = customer.Id,
    PublishableKey = "<<YOUR_PUBLISHABLE_KEY>>",
  };
}
```

```ruby
# This example sets up an endpoint using the Sinatra framework.



post '/payment-sheet' do
  # Use an existing Customer ID if this is a returning customer
  customer = Stripe::Customer.create({stripe_account: '{{CONNECTED_ACCOUNT_ID}}'})
  ephemeralKey = Stripe::EphemeralKey.create({
    customer: customer['id'],
  }, {stripe_version: '2025-10-29.clover', stripe_account: '{{CONNECTED_ACCOUNT_ID}}'})
  setupIntent = Stripe::SetupIntent.create({
    customer: customer['id'],
  })
  {
    setupIntent: setupIntent['client_secret'],
    ephemeralKey: ephemeralKey['secret'],
    customer: customer['id'],
    publishableKey: '<<YOUR_PUBLISHABLE_KEY>>'
  }.to_json
end
```

```python
# This example sets up an endpoint using the Flask framework.
# Watch this video to get started: https://youtu.be/7Ul1vfmsDck.


@app.route('/payment-sheet', methods=['POST'])
def payment_sheet():
  # Use an existing Customer ID if this is a returning customer
  customer = stripe.Customer.create(stripe_account="{{CONNECTED_ACCOUNT_ID}}")
  ephemeralKey = stripe.EphemeralKey.create(
    customer=customer['id'],
    stripe_account="{{CONNECTED_ACCOUNT_ID}}",
    stripe_version='2025-10-29.clover',
  )


  setupIntent = stripe.SetupIntent.create(
    customer=customer['id'],
  )
  return jsonify(setupIntent=setupIntent.client_secret,
                 ephemeralKey=ephemeralKey.secret,
                 customer=customer.id,
                 publishableKey='<<YOUR_PUBLISHABLE_KEY>>')
```

```php
<?php
require 'vendor/autoload.php';
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

// Use an existing Customer ID if this is a returning customer.
$customer = $stripe->customers->create(['stripe_account => '{{CONNECTED_ACCOUNT_ID}}']);
$ephemeralKey = $stripe->ephemeralKeys->create(
  [
    'customer' => $customer->id,
  ],
  [
    'stripe_account' => '{{CONNECTED_ACCOUNT_ID}}',
    'stripe_version' => '2025-10-29.clover',
  ]
);

$setupIntent = $stripe->setupIntents->create(
  [
    'customer' => $customer->id,
  ]
);

echo json_encode(
  [
    'setupIntent' => $setupIntent->client_secret,
    'ephemeralKey' => $ephemeralKey->secret,
    'customer' => $customer->id,
    'publishableKey' => '<<YOUR_PUBLISHABLE_KEY>>'
  ]
);
http_response_code(200);
```

--------------------------------

### Install Go Stripe Client Library

Source: https://docs.stripe.com/get-started/use-cases/usage-based-billing

Set up your Go project with Go Modules, then install the official Stripe client library and import it for use in your applications.

```bash
go mod init
```

```bash
go get -u github.com/stripe/stripe-go/v83
```

```go
import (\n  "github.com/stripe/stripe-go/v83"\n)
```

--------------------------------

### Configure Stripe Setup Intent with Klarna Subscription Details

Source: https://docs.stripe.com/payments/klarna/set-up-future-payments

These examples demonstrate how to create a Stripe Setup Intent and pass detailed Klarna subscription information, such as currency, a unique reference, billing interval, and next billing date/amount. This ensures Klarna accurately presents payment options like Pay in 3 or 4, requiring a Stripe secret key and customer ID. The Python example only shows client initialization.

```curl
curl https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer={{CUSTOMER_ID}} \
  --data-urlencode return_url="https://example.com/setup/complete" \
  -d "payment_method_options[klarna][currency]"=usd \
  -d "payment_method_options[klarna][subscriptions][0][reference]"=EXAMPLE_REFERENCE \
  -d "payment_method_options[klarna][subscriptions][0][interval]"=annual \
  -d "payment_method_options[klarna][subscriptions][0][next_billing][amount]"=10000 \
  -d "payment_method_options[klarna][subscriptions][0][next_billing][date]"=2026-01-01
```

```cli
stripe setup_intents create  \
  --customer={{CUSTOMER_ID}} \
  --return-url="https://example.com/setup/complete" \
  -d "payment_method_options[klarna][currency]"=usd \
  -d "payment_method_options[klarna][subscriptions][0][reference]"=EXAMPLE_REFERENCE \
  -d "payment_method_options[klarna][subscriptions][0][interval]"=annual \
  -d "payment_method_options[klarna][subscriptions][0][next_billing][amount]"=10000 \
  -d "payment_method_options[klarna][subscriptions][0][next_billing][date]"=2026-01-01
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create({
  customer: '{{CUSTOMER_ID}}',
  return_url: 'https://example.com/setup/complete',
  payment_method_options: {
    klarna: {
      currency: 'usd',
      subscriptions: [
        {
          reference: 'EXAMPLE_REFERENCE',
          interval: 'annual',
          next_billing: {
            amount: 10000,
            date: '2026-01-01',
          },
        },
      ],
    },
  },
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/api/v2/money-management/financial-accounts/object_api-version=2025-04-30

Creates a new SetupIntent object, guiding the process of setting up and saving a customer's payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. This endpoint creates a new SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### GET /v1/setup_intents/{SETUP_INTENT_ID}

Source: https://docs.stripe.com/payments/bancontact/set-up-payment

Retrieves the details of an existing Setup Intent. You can expand related objects like 'latest_attempt' to get more comprehensive information.

```APIDOC
## GET /v1/setup_intents/{SETUP_INTENT_ID}

### Description
Retrieves the details of an existing Setup Intent by its ID. This endpoint allows you to inspect the current state and properties of a Setup Intent, including any associated payment attempts.

### Method
GET

### Endpoint
/v1/setup_intents/{SETUP_INTENT_ID}

### Parameters
#### Path Parameters
- **SETUP_INTENT_ID** (string) - Required - The ID of the Setup Intent to retrieve.

#### Query Parameters
- **expand** (array of strings) - Optional - An array of properties to expand, such as `latest_attempt`.

#### Request Body
Not applicable

### Request Example
```json
{}
```

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **object** (string) - String representing the object's type. Value is `setup_intent`.
- **status** (string) - The status of the Setup Intent, one of `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `canceled`, or `succeeded`.
- **customer** (string) - ID of the Customer this Setup Intent belongs to, if one exists.
- **latest_attempt** (object) - The most recent SetupAttempt object created by this Setup Intent. Expanded if requested.
- **usage** (string) - Indicates how the payment method is intended to be used in the future.

#### Response Example
```json
{
  "id": "seti_123abc",
  "object": "setup_intent",
  "status": "succeeded",
  "customer": "cus_xyz",
  "latest_attempt": {
    "id": "setatt_123def",
    "object": "setup_attempt",
    "status": "succeeded",
    "setup_intent": "seti_123abc"
  },
  "usage": "off_session"
}
```
```

--------------------------------

### Create Stripe Product and Price using Ruby SDK

Source: https://docs.stripe.com/get-started/development-environment

Demonstrates how to use the Stripe Ruby SDK to create a new Product and an associated recurring Price. It initializes the SDK with an API key and then uses the `Stripe::Product.create` and `Stripe::Price.create` methods to define subscription items.

```ruby
require 'rubygems'
require 'stripe'
Stripe.api_key = "sk_test_YOUR_SECRET_KEY_HERE"

starter_subscription = Stripe::Product.create(
  name: 'Starter Subscription',
  description: '$12/Month subscription',
)

starter_subscription_price = Stripe::Price.create(
  currency: 'usd',
  unit_amount: 1200,
  recurring: {interval: 'month'},
  product: starter_subscription['id'],
)

puts "Success! Here is your starter subscription product id: #{starter_subscription.id}"
puts "Success! Here is your starter subscription price id: #{starter_subscription_price.id}"
```

--------------------------------

### Create Stripe Checkout Session in Setup Mode for BACS Debit

Source: https://docs.stripe.com/payments/bacs-debit/accept-a-payment

These multi-language examples illustrate how to initiate a Stripe Checkout Session in 'setup' mode, specifically designed for collecting BACS Debit payment method details for future use. The examples show how to configure 'payment_method_options' for BACS Debit, including a 'mandate_options' reference prefix, using cURL, Stripe CLI, and Ruby.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d mode=setup \
  -d "payment_method_types[]"=bacs_debit \
  -d "payment_method_options[bacs_debit][mandate_options][reference_prefix]"=EX4MPL3-
```

```cli
stripe checkout sessions create  \
  --mode=setup \
  -d "payment_method_types[0]"=bacs_debit \
  -d "payment_method_options[bacs_debit][mandate_options][reference_prefix]"=EX4MPL3-
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

session = client.v1.checkout.sessions.create({
  mode: 'setup',
  payment_method_types: ['bacs_debit'],
  payment_method_options: {bacs_debit: {mandate_options: {reference_prefix: 'EX4MPL3-'}}},
})
```

--------------------------------

### Initialize Stripe Python SDK

Source: https://docs.stripe.com/sdks/server-side

Example of initializing the Stripe Python SDK by importing the `StripeClient` and instantiating it with your secret API key.

```python
from stripe import StripeClient
client = StripeClient("<<YOUR_SECRET_KEY>>")
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/tax/calculations/create_api-version=2024-12-18

Lists all SetupIntents, allowing for pagination and filtering.

```APIDOC
## GET /v1/setup_intents

### Description
Returns a list of your SetupIntents. The SetupIntents are returned in sorted order, with the most recently created SetupIntents appearing first.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters specified.

#### Query Parameters
- Query parameters for listing (e.g., limit, starting_after, ending_before) not specified in documentation.

#### Request Body
- No request body required.

### Request Example
{
  "example": "No request body for GET operation."
}

### Response
#### Success Response (200)
- Response fields not specified in documentation.

#### Response Example
{
  "example": "Response body details not provided."
}
```

--------------------------------

### Verify Installed .NET SDK Versions

Source: https://docs.stripe.com/get-started/development-environment

Use this `dotnet` command to list all currently installed .NET SDKs on your system. This is useful for confirming that the correct versions are available before proceeding with .NET development or installing new packages.

```bash
dotnet --list-sdks
```

--------------------------------

### GET /v1/setup_attempts

Source: https://docs.stripe.com/api/setup_attempts/object_api-version=2025-01-27

Retrieves a list of Setup Attempts associated with a specific Setup Intent. The response includes a data property containing an array of SetupAttempt objects.

```APIDOC
## GET /v1/setup_attempts

### Description
Retrieves a list of SetupAttempts created by the specified SetupIntent.

### Method
GET

### Endpoint
/v1/setup_attempts

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
- **starting_after** (string) - Optional - A cursor for use in pagination. `starting_after` is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, starting with `obj_bar`, your subsequent call can include `starting_after=obj_bar` in order to fetch the next page of the list.
- **setup_intent** (string) - Optional - The SetupIntent whose SetupAttempts will be retrieved.

### Request Example
```
GET /v1/setup_attempts?limit=3&setup_intent=seti_1ErTsG2eZvKYlo2CKaT8MITz
```

### Response
#### Success Response (200)
- **object** (string) - Type of object, in this case `list`.
- **url** (string) - The URL where this list can be accessed.
- **has_more** (boolean) - True if this list has another page of items after this one that can be fetched.
- **data** (array) - Array of SetupAttempt objects.

#### Response Example
```json
{
  "object": "list",
  "url": "/v1/setup_attempts",
  "has_more": false,
  "data": [
    {
      "id": "setatt_1ErTsH2eZvKYlo2CI7ukcoF7",
      "object": "setup_attempt",
      "application": null,
      "created": 1562004309,
      "customer": null,
      "flow_directions": null,
      "livemode": false,
      "on_behalf_of": null,
      "payment_method": "pm_1ErTsG2eZvKYlo2CH0DNen59",
      "payment_method_details": {
        "card": {
          "three_d_secure": null
        },
        "type": "card"
      },
      "setup_error": null,
      "setup_intent": "seti_1ErTsG2eZvKYlo2CKaT8MITz",
      "status": "succeeded",
      "usage": "off_session"
    }
  ]
}
```
```

--------------------------------

### POST /v1/setup_intents/:id/confirm

Source: https://docs.stripe.com/api/setup_attempts/object_api-version=2025-03-31

Confirms a SetupIntent, initiating the setup process. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent, initiating the setup process.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

```

--------------------------------

### Integrate Stripe Connect Payments UI (React)

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

This example illustrates how to embed the Stripe Connect payments UI within a React application. It involves initializing the `StripeConnectInstance` using `useState` for single instantiation, wrapping the application with `ConnectComponentsProvider`, and rendering the `ConnectPayments` component. A server endpoint (`/account_session`) is required to fetch the client secret.

```html
<body>
  <div id="root"></div>
</body>
```

```jsx
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
```

```jsx
import {loadConnectAndInitialize} from '@stripe/connect-js';
import {
  ConnectPayments,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";

export default function App() {
  const [errorMessage, setErrorMessage] = useState('');

  // We use `useState` to ensure the Connect instance is only initialized once
  const [stripeConnectInstance] = useState(() => {
    const fetchClientSecret = async () => {
      // Fetch the AccountSession client secret
      const response = await fetch('/account_session', { method: "POST" });
      if (!response.ok) {
        // Handle errors on the client side here
        const {error} = await response.json();
        console.error('An error occurred: ', error);
        setErrorMessage(error)
        return undefined;
      } else {
        const {client_secret: clientSecret} = await response.json();
        return clientSecret;
      }
    }

    return loadConnectAndInitialize({
      // This is a placeholder - it should be replaced with your publishable API key.
      // Sign in to see your own test API key embedded in code samples.
      // Don’t submit any personally identifiable information in requests made with this key.
      publishableKey: "<<YOUR_PUBLISHABLE_KEY>>",
      fetchClientSecret: fetchClientSecret,
    })
  });

  return (
    <>
      {errorMessage ? (
        <div>{`Error: ${errorMessage}`}</div>
      ) : (
        <div className="container">
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectPayments />
          </ConnectComponentsProvider>
        </div>
      )}
    </>
  );
}
```

--------------------------------

### Create Stripe SetupIntent (Multi-language)

Source: https://docs.stripe.com/elements/customer-sheet

This collection of examples demonstrates how to create a Stripe SetupIntent using an existing customer ID across various programming languages. Each snippet shows the backend logic for initializing a SetupIntent and returning its client secret, essential for client-side payment setup.

```ruby
post '/create-setup-intent' do
  # Use existing Customer
  customer = {{EXISTING_CUSTOMER}}
  setupIntent = Stripe::SetupIntent.create({
    customer: customer['id'],
  })
  {
    setupIntent: setupIntent['client_secret']
  }.to_json
end
```

```python
@app.route('/create-setup-intent', methods=['POST'])
def create_setup_intent():
  # Use existing Customer
  customer = {{EXISTING_CUSTOMER}}
  setupIntent = stripe.SetupIntent.create(
    customer=customer['id'],
  )
  return jsonify(setupIntent=setupIntent.client_secret)
```

```php
<?php
require 'vendor/autoload.php';
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

// Use existing Customer
$customer = {{EXISTING_CUSTOMER}};
$setupIntent = $stripe->setupIntents->create([
  'customer' => $customer->id,
]);

echo json_encode(
  [
    'setupIntent' => $setupIntent->client_secret
  ]
);
http_response_code(200);
?>
```

```javascript
app.post('/create-setup-intent', async (req, res) => {
  // Use existing Customer
  const customer = {{EXISTING_CUSTOMER}}
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
  });
  res.json({
    setupIntent: setupIntent.client_secret
  })
});
```

```java
// This example sets up an endpoint using the Spark framework.

post("/create-setup-intent", (request, response) -> {
  response.type("application/json");

  // Use existing Customer
  Customer customer = {{EXISTING_CUSTOMER}};

  SetupIntentCreateParams setupIntentParams =
  SetupIntentCreateParams.builder()
    .setCustomer(customer.getId())
    .build();
  SetupIntent setupIntent = SetupIntent.create(setupIntentParams);

  Map<String, String> responseData = new HashMap();

  responseData.put("setupIntent", setupIntent.getClientSecret());

  return gson.toJson(responseData);
});
```

--------------------------------

### Initialize Stripe .NET SDK

Source: https://docs.stripe.com/sdks/server-side

Example of initializing the Stripe .NET SDK by setting the static `StripeConfiguration.ApiKey` property with your secret key.

```dotnet
StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";
```

--------------------------------

### Initialize Stripe PHP SDK

Source: https://docs.stripe.com/sdks/server-side

Example of initializing the Stripe PHP SDK by creating a new `StripeClient` instance with your secret API key.

```php
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');
```

--------------------------------

### Create and Confirm Stripe SetupIntent for NZ Bank Account (Multi-language)

Source: https://docs.stripe.com/payments/nz-bank-account/migrate-from-another-processor

This set of code examples illustrates how to create and immediately confirm a SetupIntent, which indicates a customer's intention to use a payment method for future payments. It specifically configures for New Zealand bank accounts and includes mandate data for compliance. You will need to replace placeholders like `<<YOUR_SECRET_KEY>>`, `{{CUSTOMER_ID}}`, and bank details with your actual values.

```curl
curl https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer={{CUSTOMER_ID}} \
  -d confirm=true \
  -d "payment_method_data[type]"=nz_bank_account \
  -d "payment_method_data[nz_bank_account][bank_code]"={{BANK_CODE}} \
  -d "payment_method_data[nz_bank_account][branch_code]"={{BRANCH_CODE}} \
  -d "payment_method_data[nz_bank_account][account_number]"={{ACCOUNT_NUMBER}} \
  -d "payment_method_data[nz_bank_account][suffix]"={{SUFFIX}} \
  -d "mandate_data[customer_acceptance][type]"=offline \
  -d "mandate_data[customer_acceptance][accepted_at]"=1692821946
```

```cli
stripe setup_intents create  \
  --customer={{CUSTOMER_ID}} \
  --confirm=true \
  -d "payment_method_data[type]"=nz_bank_account \
  -d "payment_method_data[nz_bank_account][bank_code]"={{BANK_CODE}} \
  -d "payment_method_data[nz_bank_account][branch_code]"={{BRANCH_CODE}} \
  -d "payment_method_data[nz_bank_account][account_number]"={{ACCOUNT_NUMBER}} \
  -d "payment_method_data[nz_bank_account][suffix]"={{SUFFIX}} \
  -d "mandate_data[customer_acceptance][type]"=offline \
  -d "mandate_data[customer_acceptance][accepted_at]"=1692821946
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create({
  customer: '{{CUSTOMER_ID}}',
  confirm: true,
  payment_method_data: {
    type: 'nz_bank_account',
    nz_bank_account: {
      bank_code: '{{BANK_CODE}}',
      branch_code: '{{BRANCH_CODE}}',
      account_number: '{{ACCOUNT_NUMBER}}',
      suffix: '{{SUFFIX}',
    },
  },
  mandate_data: {
    customer_acceptance: {
      type: 'offline',
      accepted_at: 1692821946,
    },
  },
})
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/financial-accounts/connect/moving-money/working-with-bankaccount-objects

Creates a SetupIntent and optionally confirms it immediately, typically used for setting up US Bank Account payment methods for future use or inbound funds flows.

```APIDOC
## POST /v1/setup_intents

### Description
This endpoint is used to create a new SetupIntent or confirm an existing one, specifically tailored for US Bank Account payment methods. It allows for attaching the PaymentMethod to a customer and configuring flow directions and verification methods.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
_None_

#### Query Parameters
_None_

#### Request Body
- **customer** (string) - Required - The ID of the Customer to attach the resulting PaymentMethod to.
- **attach_to_self** (boolean) - Optional - Whether to attach the PaymentMethod to the current account. Defaults to `false`.
- **flow_directions** (array of string) - Required - Configure what direction of funds flows this PaymentMethod will support. Expected values: `["inbound", "outbound"]`.
- **payment_method_types** (array of string) - Required - A list of payment method types to be used for this SetupIntent. Must contain `"us_bank_account"` for this flow.
- **payment_method_data** (object) - Required - Details about the payment method.
  - **type** (string) - Required - The type of the PaymentMethod. Must be `"us_bank_account"`.
  - **us_bank_account** (object) - Required - Details for the US bank account.
    - **routing_number** (string) - Required - The bank's routing number.
    - **account_number** (string) - Required - The bank account number.
    - **account_holder_type** (string) - Required - The type of account holder. Expected values: `"individual"` or `"company"`.
  - **billing_details** (object) - Required - Billing information for the bank account.
    - **name** (string) - Required - The full name of the account holder. Required for `us_bank_account` type.
    - **phone** (string | null) - Optional - The phone number of the account holder.
    - **email** (string | null) - Optional - The email address of the account holder.
    - **address** (object | null) - Optional - The billing address of the account holder.
      - **line1** (string | null) - Optional - Street address line 1.
      - **line2** (string | null) - Optional - Street address line 2.
      - **city** (string | null) - Optional - City.
      - **state** (string | null) - Optional - State/Province/Region.
      - **postal_code** (string | null) - Optional - Zip/Postal Code.
      - **country** (string | null) - Optional - Two-letter ISO country code.
- **payment_method_options** (object) - Optional - Options for particular payment methods.
  - **us_bank_account** (object) - Options for US bank accounts.
    - **verification_method** (string) - Optional - The verification method for the bank account. E.g., `"microdeposits"`.
- **mandate_data** (object) - Required - Mandate information for `inbound` flows with `us_bank_account`.
  - **customer_acceptance** (object) - Required - Details on how the customer accepted the mandate.
    - **type** (string) - Required - Type of customer acceptance. E.g., `"online"`.
    - **online** (object) - Details for online acceptance.
      - **ip_address** (string) - Required - The IP address of the customer.
      - **user_agent** (string) - Required - The user agent of the customer's browser.
- **confirm** (boolean) - Required - Set to `true` to confirm the SetupIntent immediately after creation. Defaults to `true`.

### Request Example
```json
{
  "customer": "cus_12345",
  "attach_to_self": false,
  "flow_directions": ["inbound", "outbound"],
  "payment_method_types": ["us_bank_account"],
  "payment_method_data": {
    "type": "us_bank_account",
    "us_bank_account": {
      "routing_number": "12341234",
      "account_number": "0123456789",
      "account_holder_type": "individual"
    },
    "billing_details": {
      "name": "Jenny Rosen",
      "phone": "5558675309",
      "email": "jenny@example.com",
      "address": null
    }
  },
  "payment_method_options": {
    "us_bank_account": {
      "verification_method": "microdeposits"
    }
  },
  "mandate_data": {
    "customer_acceptance": {
      "type": "online",
      "online": {
        "ip_address": "123.123.123.123",
        "user_agent": "curl/1.2.3"
      }
    }
  },
  "confirm": true
}
```

### Response
#### Success Response (200)
A SetupIntent object is returned, indicating its current status.
- **id** (string) - Unique identifier for the object.
- **object** (string) - String representing the object's type. Value is `"setup_intent"`.
- **status** (string) - The status of the SetupIntent.
  - `succeeded`: The bank account has been instantly verified or verification isn’t necessary. No further action needed.
  - `requires_action`: Further action needed to complete bank account verification. See `next_action` for details.
  - _Other statuses may include `requires_payment_method`, `requires_confirmation`, `canceled`._
- **client_secret** (string) - The client secret of this SetupIntent. Used for client-side confirmation.
- **created** (integer) - Time at which the object was created.
- **customer** (string | null) - The Customer ID associated with this SetupIntent.
- **payment_method** (string | null) - The ID of the PaymentMethod that was created or attached.
- **next_action** (object | null) - Details about the next action required to fulfill the SetupIntent, if `status` is `requires_action`.

#### Response Example
```json
{
  "id": "si_12345",
  "object": "setup_intent",
  "status": "succeeded",
  "client_secret": "si_12345_secret_abc",
  "created": 1678886400,
  "customer": "cus_12345",
  "payment_method": "pm_12345",
  "livemode": false,
  "next_action": null,
  "usage": "off_session"
}
```
```

--------------------------------

### GET /secret (Client-side Example)

Source: https://docs.stripe.com/payments/grabpay/accept-a-payment

An example server-side endpoint demonstrating how to retrieve the client secret from a created PaymentIntent and return it to a client-side application for secure payment completion.

```APIDOC
## GET /secret (Example)

### Description
This describes an example server-side endpoint designed to return the client secret of a PaymentIntent to the client-side application. The client secret is essential for securely completing the payment process from the client.

### Method
GET

### Endpoint
/secret

### Parameters
No explicit parameters are required for this example server-side endpoint.

### Request Example
(No request body for a simple GET request)

### Response
#### Success Response (200)
- **client_secret** (string) - The client secret obtained from the PaymentIntent, used for client-side payment completion.

#### Response Example
```json
{
  "client_secret": "pi_xxxxxxxxxxxxxxxxx_secret_xxxxxxxxxxxxxxxxx"
}
```
```

--------------------------------

### Initialize Stripe Client and Create Customer (Multi-language)

Source: https://docs.stripe.com/payments/klarna/set-up-future-payments

This snippet demonstrates how to initialize the Stripe API client using a secret key and then create a new customer. It includes examples for Ruby, Python, PHP, Java, Node.js, Go, and .NET, highlighting potential SDK version differences and secret key setup.

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

customer = client.v1.customers.create()
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
customer = client.v1.customers.create()
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$customer = $stripe->customers->create([]);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

CustomerCreateParams params = CustomerCreateParams.builder().build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
Customer customer = client.v1().customers().create(params);
```

```javascript
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const customer = await stripe.customers.create();
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.CustomerCreateParams{}
result, err := sc.V1Customers.Create(context.TODO(), params)
```

```csharp
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new CustomerCreateOptions();
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Customers;
Customer customer = service.Create(options);
```

--------------------------------

### Create Stripe SetupIntent for Payment Method Setup (Java, Go)

Source: https://docs.stripe.com/payments/mobile/finalize-payments-on-the-server

These code snippets illustrate how to create a Stripe SetupIntent on your backend server. The process involves initializing the Stripe API with your secret key, building SetupIntent parameters including a customer ID and a confirmation token, and then creating the intent. The server responds with the client secret needed for the client-side confirmation.

```java
import java.util.HashMap;
import java.util.Map;

import com.stripe.Stripe;
import com.stripe.model.SetupIntent;
import com.stripe.param.SetupIntentCreateParams;

import com.google.gson.Gson;

import static spark.Spark.post;

public class StripeJavaQuickStart {
  public static void main(String[] args) {
    Gson gson = new Gson();
    Stripe.apiKey = "<<YOUR_SECRET_KEY>>";

    post("/create-intent", (request, response) -> {
      JsonObject postBody = new JsonParser().parse(request.body()).getAsJsonObject();
      SetupIntentCreateParams.Builder paramsBuilder =
        SetupIntentCreateParams
          .builder()
          .setCustomer(customer.getId()) // The Customer ID you previously created
          // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
          .setAutomaticPaymentMethods(
            SetupIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build()
          )
          .setConfirm(true)
          .setConfirmationToken(postBody.get("confirmation_token_id").getAsString()); // the ConfirmationToken ID sent by your client
      SetupIntentCreateParams params = paramsBuilder.build();

      Map<String, String> map = new HashMap();
      try {
        SetupIntent setupIntent = SetupIntent.create(params);
        map.put("client_secret", setupIntent.getClientSecret());
      } catch (CardException e) {
        map.put("error", e.getUserMessage());
      } catch (Exception e) {
        map.put("error", e.getMessage());
      }
      return map;
    }, gson::toJson);
  }
}
```

```go
package main

import (
  "encoding/json"
  "net/http"

  "github.com/stripe/stripe-go/v76.0.0"
  "github.com/stripe/stripe-go/v76.0.0/setupintent"
)

type CheckoutData struct {
  ClientSecret string `json:"client_secret"`
}

func main() {
  stripe.Key = "<<YOUR_SECRET_KEY>>"

  http.HandleFunc("/create-intent", func(w http.ResponseWriter, r *http.Request) {
    var req struct {
      ConfirmationTokenID string `json:"confirmation_token_id"`
      ShouldSavePaymentMethod bool `json:"should_save_payment_method"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      log.Printf("json.NewDecoder.Decode: %v", err)
      return
    }
    params := &stripe.SetupIntentParams{
      Customer: stripe.String(c.ID), // The Customer ID you previously created
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      AutomaticPaymentMethods: &stripe.SetupIntentAutomaticPaymentMethodsParams{
        Enabled: stripe.Bool(true),
      },
      Confirm: stripe.Bool(true),
      ConfirmationToken: stripe.String(req.ConfirmationTokenID), // the ConfirmationToken ID sent by your client
    }
    intent, err := setupintent.New(params);
    if err == nil {
      w.Header().Set("Content-Type", "application/json")
      w.WriteHeader(http.StatusOK)
      data := CheckoutData{
        ClientSecret: intent.ClientSecret,
      }
      json.NewEncoder(w).Encode(data)
    } else {
      if stripeErr, ok := err.(*stripe.Error); ok {
        switch stripeErr.Type {
          case stripe.ErrorTypeCard:
            http.Error(w, stripeErr.Msg, http.StatusInternalServerError)
          default:
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
      } else {
        http.Error(w, err.Error(), http.StatusInternalServerError)
      }
    }
  })

  http.ListenAndServe(":4242", nil)
}
```

--------------------------------

### GET /v1/payment_method_configurations

Source: https://docs.stripe.com/api/disputes/object_api-version=2024-09-30

Lists all PaymentMethodConfigurations, providing an overview of your setup.

```APIDOC
## GET /v1/payment_method_configurations

### Description
Lists all PaymentMethodConfigurations configured in your account.

### Method
GET

### Endpoint
/v1/payment_method_configurations
```

--------------------------------

### Create and Confirm Stripe SetupIntent (Go, .NET)

Source: https://docs.stripe.com/payments/finalize-payments-on-the-server-legacy

This server-side code demonstrates how to create and confirm a Stripe SetupIntent, which is used for collecting payment method details for future payments. It handles a request that includes a confirmation token ID and a flag to save the payment method, then utilizes the Stripe SDKs (Go and .NET) to configure and confirm the SetupIntent, enabling automatic payment methods. The client secret is returned upon success, and Stripe-specific errors are handled gracefully.

```go
package main

import (
  "encoding/json"
  "net/http"

  "github.com/stripe/stripe-go/v76.0.0"
  "github.com/stripe/stripe-go/v76.0.0/setupintent"
)

type CheckoutData struct {
  ClientSecret string `json:"client_secret"`
}

func main() {
  stripe.Key = "<<YOUR_SECRET_KEY>>"

  http.HandleFunc("/create-intent", func(w http.ResponseWriter, r *http.Request) {
    var req struct {
      ConfirmationTokenID string `json:"confirmation_token_id"`
      ShouldSavePaymentMethod bool `json:"should_save_payment_method"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      log.Printf("json.NewDecoder.Decode: %v", err)
      return
    }
    params := &stripe.SetupIntentParams{
      Customer: stripe.String(c.ID), // The Customer ID you previously created
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      AutomaticPaymentMethods: &stripe.SetupIntentAutomaticPaymentMethodsParams{
        Enabled: stripe.Bool(true),
      },
      Confirm: stripe.Bool(true),
      ConfirmationToken: stripe.String(req.ConfirmationTokenID), // the ConfirmationToken ID sent by your client
    }
    intent, err := setupintent.New(params);
    if err == nil {
      w.Header().Set("Content-Type", "application/json")
      w.WriteHeader(http.StatusOK)
      data := CheckoutData{
        ClientSecret: intent.ClientSecret,
      }
      json.NewEncoder(w).Encode(data)
    } else {
      if stripeErr, ok := err.(*stripe.Error); ok {
        switch stripeErr.Type {
          case stripe.ErrorTypeCard:
            http.Error(w, stripeErr.Msg, http.StatusInternalServerError)
          default:
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
      } else {
        http.Error(w, err.Error(), http.StatusInternalServerError)
      }
    }
  })

  http.ListenAndServe(":4242", nil)
}
```

```csharp
using System;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace StripeExampleApi.Controllers
{
  [Route("create-intent")]
  [ApiController]
  public class CheckoutApiController : Controller
  {
    public CheckoutApiController()
    {
      StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>"
    }

    [HttpPost]
    public ActionResult Post(IntentCreateRequest request)
    {
      var options = new SetupIntentCreateOptions()
      {
        Customer = customer.Id, // The Customer ID you previously created
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        AutomaticPaymentMethods = new SetupIntentAutomaticPaymentMethodsOptions
        {
          Enabled = true,
        },
        Confirm = true,
        ConfirmationToken = request.ConfirmationTokenId, // the ConfirmationToken ID sent by your client
      };
      var service = new SetupIntentService();
      try
      {
        SetupIntent intent = service.Create(options);
        return Json(new { client_secret = intent.ClientSecret });
      }
      catch (StripeException e)
      {
        this.HttpContext.Response.StatusCode = 400;
        switch (e.StripeError.Type)
        {
          case "card_error":
            return Json(new { error = e.Message }); // For card errors, the message can be shown to your users
          default:
            return Json(new { error = e.Message }); // Other errors may not be localized
        }
      }
    }

    public class IntentCreateRequest
    {
      [JsonProperty("confirmation_token_id")]
      public string ConfirmationTokenId { get; set; }
      [JsonProperty("should_save_payment_method")]
      public bool ShouldSavePaymentMethod { get; set; }
    }
  }
}
```

--------------------------------

### Create and Confirm Stripe Setup Intent for US Bank Accounts

Source: https://docs.stripe.com/financial-accounts/connect/examples/moving-money

These code examples demonstrate how to programmatically create and immediately confirm a Stripe Setup Intent. The intent is configured to attach to itself, process 'us_bank_account' payment methods using mock details, and includes mandatory online mandate data for customer acceptance. Each example shows how to perform this operation on behalf of a connected Stripe account.

```python
# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
setup_intent = client.v1.setup_intents.create(
  {
    "attach_to_self": True,
    "flow_directions": ["inbound", "outbound"],
    "payment_method_types": ["us_bank_account"],
    "payment_method_data": {
      "type": "us_bank_account",
      "us_bank_account": {
        "routing_number": "110000000",
        "account_number": "000123456789",
        "account_holder_type": "company",
      },
      "billing_details": {"name": "Company Corp"},
    },
    "confirm": True,
    "mandate_data": {
      "customer_acceptance": {
        "type": "online",
        "online": {"ip_address": "123.123.123.123", "user_agent": "curl/1.2.3"},
      },
    },
  },
  {"stripe_account": "{{CONNECTEDACCOUNT_ID}}"},
)
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$setupIntent = $stripe->setupIntents->create(
  [
    'attach_to_self' => true,
    'flow_directions' => ['inbound', 'outbound'],
    'payment_method_types' => ['us_bank_account'],
    'payment_method_data' => [
      'type' => 'us_bank_account',
      'us_bank_account' => [
        'routing_number' => '110000000',
        'account_number' => '000123456789',
        'account_holder_type' => 'company',
      ],
      'billing_details' => ['name' => 'Company Corp'],
    ],
    'confirm' => true,
    'mandate_data' => [
      'customer_acceptance' => [
        'type' => 'online',
        'online' => [
          'ip_address' => '123.123.123.123',
          'user_agent' => 'curl/1.2.3',
        ],
      ],
    ],
  ],
  ['stripe_account' => '{{CONNECTEDACCOUNT_ID}}']
);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SetupIntentCreateParams params =
  SetupIntentCreateParams.builder()
    .setAttachToSelf(true)
    .addFlowDirection(SetupIntentCreateParams.FlowDirection.INBOUND)
    .addFlowDirection(SetupIntentCreateParams.FlowDirection.OUTBOUND)
    .addPaymentMethodType("us_bank_account")
    .setPaymentMethodData(
      SetupIntentCreateParams.PaymentMethodData.builder()
        .setType(SetupIntentCreateParams.PaymentMethodData.Type.US_BANK_ACCOUNT)
        .setUsBankAccount(
          SetupIntentCreateParams.PaymentMethodData.UsBankAccount.builder()
            .setRoutingNumber("110000000")
            .setAccountNumber("000123456789")
            .setAccountHolderType(
              SetupIntentCreateParams.PaymentMethodData.UsBankAccount.AccountHolderType.COMPANY
            )
            .build()
        )
        .setBillingDetails(
          SetupIntentCreateParams.PaymentMethodData.BillingDetails.builder()
            .setName("Company Corp")
            .build()
        )
        .build()
    )
    .setConfirm(true)
    .setMandateData(
      SetupIntentCreateParams.MandateData.builder()
        .setCustomerAcceptance(
          SetupIntentCreateParams.MandateData.CustomerAcceptance.builder()
            .setType(SetupIntentCreateParams.MandateData.CustomerAcceptance.Type.ONLINE)
            .setOnline(
              SetupIntentCreateParams.MandateData.CustomerAcceptance.Online.builder()
                .setIpAddress("123.123.123.123")
                .setUserAgent("curl/1.2.3")
                .build()
            )
            .build()
        )
        .build()
    )
    .build();

RequestOptions requestOptions =
  RequestOptions.builder().setStripeAccount("{{CONNECTEDACCOUNT_ID}}").build();
// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.

SetupIntent setupIntent = client.v1().setupIntents().create(params, requestOptions);
```

```javascript
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntent = await stripe.setupIntents.create(
  {
    attach_to_self: true,
    flow_directions: ['inbound', 'outbound'],
    payment_method_types: ['us_bank_account'],
    payment_method_data: {
      type: 'us_bank_account',
      us_bank_account: {
        routing_number: '110000000',
        account_number: '000123456789',
        account_holder_type: 'company',
      },
      billing_details: {
        name: 'Company Corp',
      },
    },
    confirm: true,
    mandate_data: {
      customer_acceptance: {
        type: 'online',
        online: {
          ip_address: '123.123.123.123',
          user_agent: 'curl/1.2.3',
        },
      },
    },
  },
  {
    stripeAccount: '{{CONNECTEDACCOUNT_ID}}',
  }
);
```

--------------------------------

### GET /v1/entitlements/active_entitlements

Source: https://docs.stripe.com/docs/api/subscriptions

List all active entitlements.

```APIDOC
## GET /v1/entitlements/active_entitlements

### Description
Retrieves a list of all active entitlements. An active entitlement describes access to a feature for a customer.

### Method
GET

### Endpoint
/v1/entitlements/active_entitlements

### Parameters
#### Query Parameters
- **customer** (string) - Optional - Filter entitlements by customer ID.
- **feature** (string) - Optional - Filter entitlements by feature ID.
- **limit** (integer) - Optional - A limit on the number of objects to be returned.

### Request Example
{
  "Note": "No request body for GET requests"
}

### Response
#### Success Response (200)
- **object** (string) - Value is 'list'.
- **data** (array) - A list containing Active Entitlement objects.

#### Response Example
{
  "object": "list",
  "data": [
    {
      "id": "ent_abc123",
      "object": "active_entitlement",
      "customer": "cus_def456",
      "feature": "feat_xyz789",
      "expires_at": 1704067200
    },
    {
      "id": "ent_mno987",
      "object": "active_entitlement",
      "customer": "cus_def456",
      "feature": "feat_pqr321",
      "expires_at": null
    }
  ],
  "has_more": false
}
```

--------------------------------

### Install Stripe client libraries for various programming languages

Source: https://docs.stripe.com/issuing/controls/real-time-authorizations/quickstart

These commands provide instructions for installing the official Stripe client library for different programming languages. Choose the method appropriate for your project's language and package manager to integrate Stripe functionalities.

```npm
npm install --save stripe
```

```npm
npm install --save stripe @stripe/stripe-js next
```

```ruby
gem install stripe
```

```bundler
gem 'stripe'
```

```maven
<dependency>\n<groupId>com.stripe</groupId>\n<artifactId>stripe-java</artifactId>\n<version>{VERSION}</version>\n</dependency>
```

```gradle
implementation "com.stripe:stripe-java:{VERSION}"
```

```pip
pip3 install stripe
```

```composer
composer require stripe/stripe-php
```

```go
go get -u github.com/stripe/stripe-go/v83
```

```dotnet
dotnet add package Stripe.net
```

```nuget
Install-Package Stripe.net
```

--------------------------------

### GET /v1/reserve/releases

Source: https://docs.stripe.com/docs/api/subscriptions

List all reserve releases.

```APIDOC
## GET /v1/reserve/releases

### Description
List all reserve releases.

### Method
GET

### Endpoint
/v1/reserve/releases

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Install Stripe .NET Library

Source: https://docs.stripe.com/payments/klarna/set-up-future-payments

Installs the official Stripe .NET library, providing C# applications with access to the Stripe API. Installation can be performed using `dotnet add package` or NuGet Package Manager.

```bash
dotnet add package Stripe.net
dotnet restore
```

```bash
# Or install with NuGet
Install-Package Stripe.net
```

--------------------------------

### Handle Stripe SetupIntent and Display Payment Form (Go & .NET)

Source: https://docs.stripe.com/payments/kr-card/set-up-future-payments

These examples demonstrate how to create or fetch a SetupIntent on the server-side and pass its client secret to the frontend. The HTML forms are then rendered with the client secret embedded, preparing for client-side payment confirmation. Dependencies include the Stripe SDK for the respective server-side language and an HTML templating engine.

```html
<form id="payment-form" data-secret="{{ .ClientSecret }}">
  <button id="submit">Submit</button>
</form>
```

```go
package main

import (
  "html/template"
  "net/http"

  stripe "github.com/stripe/stripe-go/v76.0.0"
)

type CheckoutData struct {
  ClientSecret string
}

func main() {
  checkoutTmpl := template.Must(template.ParseFiles("views/checkout.html"))

  http.HandleFunc("/checkout", func(w http.ResponseWriter, r *http.Request) {
    intent := // ... Fetch or create the SetupIntent
    data := CheckoutData{
      ClientSecret: intent.ClientSecret,
    }
    checkoutTmpl.Execute(w, data)
  })

  http.ListenAndServe(":3000", nil)
}
```

```html
<form id="payment-form" data-secret="@ViewData["ClientSecret"]"><button id="submit">Submit</button></form>
```

```csharp
using System;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace StripeExampleApi.Controllers
{
  [Route("/[controller]")]
  public class CheckoutApiController : Controller
  {
    public IActionResult Index()
    {
      var intent = // ... Fetch or create the SetupIntent
      ViewData["ClientSecret"] = intent.ClientSecret;
      return View();
    }
  }
}
```

--------------------------------

### Install Stripe Python Library

Source: https://docs.stripe.com/payments/konbini/accept-a-payment

These snippets detail how to install the Stripe Python library using `pip`, a common package installer. It provides access to the Stripe API for your Python applications. The comments also guide you on finding the package on PyPI or specifying a particular version.

```bash
pip3 install --upgrade stripe
```

```python
# Or find the Stripe package on http://pypi.python.org/pypi/stripe/
# Find the version you want to pin:
```

--------------------------------

### Create Stripe SetupIntent for US Bank Account

Source: https://docs.stripe.com/baas/start-integration/integration-guides/embedded-finance

This code demonstrates how to create a Stripe SetupIntent object, specifically configured for US bank accounts with microdeposit verification. It includes setting flow directions, payment method data with routing and account numbers, account holder type, billing details, and mandate data for online customer acceptance. The SetupIntent is then created using the Stripe API client in Go and C#/.NET.

```go
stripe.String(stripe.SetupIntentFlowDirectionInbound),
stripe.String(stripe.SetupIntentFlowDirectionOutbound),
  },
  PaymentMethodTypes: []*string{stripe.String("us_bank_account")},
  PaymentMethodData: &stripe.SetupIntentCreatePaymentMethodDataParams{
    Type: stripe.String("us_bank_account"),
    USBankAccount: &stripe.SetupIntentCreatePaymentMethodDataUSBankAccountParams{
      RoutingNumber: stripe.String("110000000"),
      AccountNumber: stripe.String("000123456789"),
      AccountHolderType: stripe.String("company"),
    },
    BillingDetails: &stripe.SetupIntentCreatePaymentMethodDataBillingDetailsParams{
      Name: stripe.String("Company Corp"),
    },
  },
  Confirm: stripe.Bool(true),
  MandateData: &stripe.SetupIntentCreateMandateDataParams{
    CustomerAcceptance: &stripe.SetupIntentCreateMandateDataCustomerAcceptanceParams{
      Type: stripe.String("online"),
      Online: &stripe.SetupIntentCreateMandateDataCustomerAcceptanceOnlineParams{
        IPAddress: stripe.String("123.123.123.123"),
      },
    },
  },
}
params.SetStripeAccount("{{CONNECTEDACCOUNT_ID}}")
result, err := sc.V1SetupIntents.Create(context.TODO(), params)
```

```csharp
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SetupIntentCreateOptions
{
    AttachToSelf = true,
    FlowDirections = new List<string> { "inbound", "outbound" },
    PaymentMethodTypes = new List<string> { "us_bank_account" },
    PaymentMethodData = new SetupIntentPaymentMethodDataOptions
    {
        Type = "us_bank_account",
        UsBankAccount = new SetupIntentPaymentMethodDataUsBankAccountOptions
        {
            RoutingNumber = "110000000",
            AccountNumber = "000123456789",
            AccountHolderType = "company",
        },
        BillingDetails = new SetupIntentPaymentMethodDataBillingDetailsOptions
        {
            Name = "Company Corp",
        },
    },
    Confirm = true,
    MandateData = new SetupIntentMandateDataOptions
    {
        CustomerAcceptance = new SetupIntentMandateDataCustomerAcceptanceOptions
        {
            Type = "online",
            Online = new SetupIntentMandateDataCustomerAcceptanceOnlineOptions
            {
                IpAddress = "123.123.123.123",
            },
        },
    },
};
var requestOptions = new RequestOptions
{
    StripeAccount = "{{CONNECTEDACCOUNT_ID}}",
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options, requestOptions);
```

--------------------------------

### Create Stripe Account Session with Go

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

This Go code sets up a basic HTTP server that exposes an endpoint to create a Stripe Account Session. It initializes the Stripe client with a secret key, defines a handler function to process POST requests, and configures the Account Session to enable specific payment component features such as refund management, dispute management, and payment capture for a connected account. The server listens on localhost:4242 and serves static files from a 'public' directory.

```go
package main

import (
  "bytes"
  "encoding/json"
  "io"
  "log"
  "net/http"
	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/accountsession"
)

func main() {
    // This is a placeholder - it should be replaced with your secret API key.
    // Sign in to see your own test API key embedded in code samples.
    // Don’t submit any personally identifiable information in requests made with this key.
    stripe.Key = '<<YOUR_SECRET_KEY>>'

    http.Handle("/", http.FileServer(http.Dir("public")))
    http.HandleFunc("/account_session", CreateAccountSession)
    addr := "localhost:4242"
    log.Printf("Listening on %s", addr)
    log.Fatal(http.ListenAndServe(addr, nil))
}

func CreateAccountSession(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
      http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
      return
    }

    accountSession, err := accountsession.New(
      &stripe.AccountSessionParams{
        Account: stripe.String("{{CONNECTED_ACCOUNT_ID}}"),
        Components: &stripe.AccountSessionComponentsParams{
          Payments: &stripe.AccountSessionComponentsPaymentsParams{
            Enabled: stripe.Bool(true),
            Features: &stripe.AccountSessionComponentsPaymentsFeaturesParams{
              RefundManagement: stripe.Bool(true),
              DisputeManagement: stripe.Bool(true),
              CapturePayments: stripe.Bool(true),
            },
          },
        },
      },
    )

    if err != nil {
      log.Printf("An error occurred when calling the Stripe API to create an account session: %v", err)
      w.WriteHeader(http.StatusInternalServerError)
      if stripeErr, ok := err.(*stripe.Error); ok {
        writeJSON(w, struct {
          Error string `json:"error"`
        }{
          Error: stripeErr.Msg,
        })
      } else {
        writeJSON(w, struct {
          Error string `json:"error"`
        }{
          Error: err.Error(),
        })
      }
      return
    }

    writeJSON(w, struct {
      ClientSecret string `json:"client_secret"`
    }{
      ClientSecret: accountSession.ClientSecret,
    })
}

func writeJSON(w http.ResponseWriter, v interface{}) {
  var buf bytes.Buffer
  if err := json.NewEncoder(&buf).Encode(v); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    log.Printf("json.NewEncoder.Encode: %v", err)
    return
  }
  w.Header().Set("Content-Type", "application/json")
  if _, err := io.Copy(w, &buf); err != nil {
    log.Printf("io.Copy: %v", err)
    return
  }
}
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/payments/ach-direct-debit/migrating-from-another-processor

Creates a SetupIntent object. A SetupIntent is a way to set up a customer's payment method for future payments without immediately charging them. This endpoint specifically demonstrates setting up a US bank account.

```APIDOC
## POST /v1/setup_intents

### Description
This endpoint creates a new SetupIntent to collect and confirm payment method details for future use. It supports various payment methods, with the example focusing on US bank accounts.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
(None)

#### Query Parameters
(None)

#### Request Body
- **payment_method_types** (array of string) - Required - A list of the payment method types that this SetupIntent is allowed to set up. Example: `["us_bank_account"]`.
- **customer** (string) - Required - The ID of the customer associated with this SetupIntent.
- **confirm** (boolean) - Required - Set to `true` to confirm the SetupIntent immediately after creation.
- **payment_method_options** (object) - Optional - Options for this SetupIntent's payment method. For `us_bank_account`:
  - **us_bank_account** (object) - Options specific to US bank accounts.
    - **verification_method** (string) - Optional - The verification method for the US bank account. Example: `"skip"`.
- **payment_method_data** (object) - Optional - Data for creating a PaymentMethod directly from this SetupIntent.
  - **type** (string) - Required - The type of the PaymentMethod. Example: `"us_bank_account"`.
  - **billing_details** (object) - Required - Billing information associated with the PaymentMethod.
    - **name** (string) - Required - The full name of the account holder.
  - **us_bank_account** (object) - Required - Details for a US bank account PaymentMethod.
    - **routing_number** (string) - Required - The routing number of the US bank account.
    - **account_number** (string) - Required - The account number of the US bank account.
    - **account_holder_type** (string) - Required - The type of account holder. Accepted values: `"individual"` or `"company"`.
- **mandate_data** (object) - Optional - This hash contains details about the Mandate that is created or updated by this SetupIntent.
  - **customer_acceptance** (object) - Required - Details about the customer's acceptance of the mandate.
    - **type** (string) - Required - The type of customer acceptance. Example: `"offline"`.
    - **accepted_at** (integer) - Required - The time at which the customer accepted the Mandate. Represented as a Unix timestamp.

### Request Example
```json
{
  "payment_method_types": [
    "us_bank_account"
  ],
  "customer": "{{CUSTOMER_ID}}",
  "confirm": true,
  "payment_method_options": {
    "us_bank_account": {
      "verification_method": "skip"
    }
  },
  "payment_method_data": {
    "type": "us_bank_account",
    "billing_details": {
      "name": "{{ACCOUNT_HOLDER_NAME}}"
    },
    "us_bank_account": {
      "routing_number": "{{ROUTING_NUMBER}}",
      "account_number": "{{ACCOUNT_NUMBER}}",
      "account_holder_type": "individual"
    }
  },
  "mandate_data": {
    "customer_acceptance": {
      "type": "offline",
      "accepted_at": 1692821946
    }
  }
}
```

### Response
#### Success Response (200)
A SetupIntent object is returned upon successful creation and confirmation.
- **id** (string) - Unique identifier for the SetupIntent.
- **object** (string) - Value is always `setup_intent`.
- **status** (string) - The current status of the SetupIntent. Example: `succeeded`, `requires_action`.
- **client_secret** (string) - The client secret of this SetupIntent. Used for client-side confirmation.
- **payment_method** (string) - ID of the PaymentMethod (if any) used with this SetupIntent.
- **usage** (string) - Indicates how the PaymentMethod is intended to be used. Example: `"off_session"`.

#### Response Example
```json
{
  "id": "seti_12345",
  "object": "setup_intent",
  "amount": null,
  "cancellation_reason": null,
  "client_secret": "seti_12345_secret_abc",
  "confirm": true,
  "created": 1692821946,
  "customer": "{{CUSTOMER_ID}}",
  "description": null,
  "last_setup_error": null,
  "livemode": false,
  "mandate": "mandate_12345",
  "next_action": null,
  "on_behalf_of": null,
  "payment_method": "pm_12345",
  "payment_method_options": {
    "us_bank_account": {
      "verification_method": "skip"
    }
  },
  "payment_method_types": [
    "us_bank_account"
  ],
  "single_use_mandate": null,
  "status": "succeeded",
  "usage": "off_session"
}
```
```

--------------------------------

### Create Customer using Ruby SDK

Source: https://docs.stripe.com/sdks/server-side

Example of creating a new customer named 'John Doe' using the Stripe Ruby SDK. This snippet includes the setup of the Stripe client with your secret API key.

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

customer = client.v1.customers.create({name: 'John Doe'})
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/payments/sepa-debit/accept-a-payment

Creates a Setup Intent object. A Setup Intent is a Stripe API object that can be used to describe the process of setting up a customer's payment method for future payments. This specific example demonstrates creating a Setup Intent for SEPA Debit with a custom mandate reference prefix.

```APIDOC
## POST /v1/setup_intents

### Description
This endpoint creates a new Setup Intent object. A Setup Intent guides you through the process of setting up a customer's payment method for future payments. This example specifically configures a Setup Intent for `sepa_debit` payment methods, including options for mandate generation.

### Method
POST

### Endpoint
`/v1/setup_intents`

### Parameters
#### Request Body
- **payment_method_types** (array of string) - Required - A list of the payment method types that this SetupIntent is allowed to set up.
- **payment_method_options** (object) - Optional - Payment-method-specific configuration for this SetupIntent.
  - **sepa_debit** (object) - Optional - Configuration for SEPA Debit payments.
    - **mandate_options** (object) - Optional - This hash contains details about the mandate to create.
      - **reference_prefix** (string) - Optional - A custom reference prefix to use for the mandate.

### Request Example
```json
{
  "payment_method_types": ["sepa_debit"],
  "payment_method_options": {
    "sepa_debit": {
      "mandate_options": {
        "reference_prefix": "EX4MPL3-"
      }
    }
  }
}
```

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the object.
- **object** (string) - String representing the object's type. Value is `setup_intent`.
- **client_secret** (string) - The client secret of this SetupIntent. Used for client-side confirmation.
- **status** (string) - The status of the SetupIntent, indicating its current state in the setup process (e.g., `requires_payment_method`, `succeeded`).
- **created** (integer) - Time at which the object was created. Measured in seconds since the Unix epoch.
- **livemode** (boolean) - Has the value `true` if the object exists in live mode or `false` if the object exists in test mode.
- **payment_method_types** (array of string) - The payment method types that this SetupIntent is allowed to set up.
- **usage** (string) - Indicates how the payment method is intended to be used in the future.
- **payment_method_options** (object) - Payment-method-specific configuration for this SetupIntent.

#### Response Example
```json
{
  "id": "seti_1P1R70AChsW75Y5fT1A2B3C4",
  "object": "setup_intent",
  "client_secret": "seti_1P1R70AChsW75Y5fT1A2B3C4_secret_12345ABCDEF6789",
  "livemode": false,
  "status": "requires_payment_method",
  "payment_method_types": ["sepa_debit"],
  "payment_method_options": {
    "sepa_debit": {
      "mandate_options": {
        "reference_prefix": "EX4MPL3-"
      }
    }
  },
  "created": 1713297600,
  "usage": "off_session"
}
```
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/api/refunds/object_api-version=2024-10-28

Creates a new SetupIntent to guide the process of setting up and saving customer payment credentials for future use.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent to guide the process of setting up and saving customer payment credentials for future use.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
(No path parameters)

#### Query Parameters
(No query parameters)

#### Request Body
(No request body parameters documented)

### Request Example
{}

### Response
#### Success Response (200)
(No response fields documented)

#### Response Example
{}
```

--------------------------------

### POST /v1/setup_intents/:id/confirm

Source: https://docs.stripe.com/api/webhook_endpoints/create_api-version=2024-10-28

Confirms a SetupIntent. The SetupIntent transitions through multiple statuses as it guides you through the setup process.

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent. The SetupIntent transitions through multiple statuses as it guides you through the setup process, ensuring successful setup results in payment credentials optimized for future payments.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters
- None provided

#### Request Body
- Not specified in documentation.

### Request Example
{
  "example": "Request body not specified"
}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{
  "example": "Response body not specified"
}
```

--------------------------------

### List Stripe SetupIntents for a Customer

Source: https://docs.stripe.com/payments/acss-debit/set-up-payment

These code examples demonstrate how to retrieve a list of SetupIntents associated with a specific customer in Stripe. This process is crucial for identifying existing PaymentMethods and Mandates, which are then used to initiate future off-session payments without requiring the customer's presence. Authentication typically requires your secret API key.

```curl
curl -G https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer="{{CUSTOMER_ID}}"
```

```cli
stripe setup_intents list  \
  --customer="{{CUSTOMER_ID}}"
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intents = client.v1.setup_intents.list({customer: '{{CUSTOMER_ID}}'})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

```

--------------------------------

### GET /v1/entitlements/features

Source: https://docs.stripe.com/docs/api/subscriptions

List all features available in your system.

```APIDOC
## GET /v1/entitlements/features

### Description
Retrieves a list of all features. Features represent monetizable abilities or functionalities in your system.

### Method
GET

### Endpoint
/v1/entitlements/features

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - A limit on the number of objects to be returned.
- **starting_after** (string) - Optional - A cursor for use in pagination.

### Request Example
{
  "Note": "No request body for GET requests"
}

### Response
#### Success Response (200)
- **object** (string) - Value is 'list'.
- **data** (array) - A list containing Feature objects.

#### Response Example
{
  "object": "list",
  "data": [
    {
      "id": "feat_abc123",
      "object": "feature",
      "name": "Premium Analytics",
      "livemode": false
    },
    {
      "id": "feat_def456",
      "object": "feature",
      "name": "Dedicated Support",
      "livemode": false
    }
  ],
  "has_more": false
}
```

--------------------------------

### Create Stripe Payment Sheet Server-Side Resources (Go, .NET)

Source: https://docs.stripe.com/payments/mobile/set-up-future-payments

These server-side code examples demonstrate how to create the necessary Stripe resources—Customer, Ephemeral Key, and Setup Intent—to initialize the Payment Sheet. The endpoints retrieve customer details, generate a short-lived ephemeral key for client-side authentication, and create a setup intent to collect payment details. The response includes the client_secret for the Setup Intent, the Ephemeral Key secret, the Customer ID, and the publishable key, which are passed to the client-side Payment Sheet SDK.

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
stripe.Key = "<<YOUR_SECRET_KEY>>"

func handlePaymentSheet(w http.ResponseWriter, r *http.Request) {
  if r.Method != "POST" {
    http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
    return
  }

  // Use an existing Customer ID if this is a returning customer.
  cparams := &stripe.CustomerParams{}
  stripe.SetStripeAccount(cparams.ExtraParams, "{{CONNECTED_ACCOUNT_ID}}")
  c, _ := customer.New(cparams)

  ekparams := &stripe.EphemeralKeyParams{
    Customer: stripe.String(c.ID),
    StripeAccount: stripe.String("{{CONNECTED_ACCOUNT_ID}}"),
    StripeVersion: stripe.String("2025-10-29.clover"),
  }
  ek, _ := ephemeralKey.New(ekparams)

  siparams := &stripe.SetupIntentParams{
    Customer: stripe.String(c.ID),
  }
  si, _ := setupintent.New(siparams)

  writeJSON(w, struct {
    SetupIntent    string `json:"setupIntent"`
    EphemeralKey   string `json:"ephemeralKey"`
    Customer       string `json:"customer"`
    PublishableKey string `json:"publishableKey"`
  }{
    SetupIntent: si.ClientSecret,
    EphemeralKey: ek.Secret,
    Customer: c.ID,
    PublishableKey: "<<YOUR_PUBLISHABLE_KEY>>",
  })
}
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";

[HttpPost("payment-sheet")]
public ActionResult<PaymentSheetCreateResponse> CreatePaymentSheet([FromBody] CreatePaymentSheetRequest req)
{
  // Use an existing Customer ID if this is a returning customer.
  var customerOptions = new CustomerCreateOptions();
  var customerService = new CustomerService();
  var requestOptions = new RequestOptions
{
    StripeAccount = "{{CONNECTED_ACCOUNT_ID}}"
};
  var customer = customerService.Create(customerOptions, requestOptions);
  var ephemeralKeyOptions = new EphemeralKeyCreateOptions
  {
    Customer = customer.Id,
    StipeAccount = "{{CONNECTED_ACCOUNT_ID}}",
    StripeVersion = "2025-10-29.clover",
  };
  var ephemeralKeyService = new EphemeralKeyService();
  var ephemeralKey = ephemeralKeyService.Create(ephemeralKeyOptions);

  var setupIntentOptions = new SetupIntentCreateOptions
  {
    Customer = customer.Id,
  };
  var setupIntentService = new SetupIntentService();
  SetupIntent setupIntent = setupIntentService.Create(setupIntentOptions);

  return new PaymentSheetCreateResponse
  {
    SetupIntent = setupIntent.ClientSecret,
    EphemeralKey = ephemeralKey.Secret,

    Customer = customer.Id,
    PublishableKey = "<<YOUR_PUBLISHABLE_KEY>>",
  };
}
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/v2/core/events/list_api-version=2025-10-29

Guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
[No path parameters mentioned in the provided text.]

#### Query Parameters
[No query parameters mentioned in the provided text.]

#### Request Body
[No request body details mentioned in the provided text.]

### Request Example
{}

### Response
#### Success Response (200)
[No response details mentioned in the provided text.]

#### Response Example
{}
```

--------------------------------

### GET /v1/payment_attempt_records

Source: https://docs.stripe.com/docs/api/subscriptions

List all Payment Attempt Records.

```APIDOC
## GET /v1/payment_attempt_records

### Description
Retrieves a list of all Payment Attempt Records. A Payment Attempt Record represents an individual attempt at making a payment, on or off Stripe.

### Method
GET

### Endpoint
/v1/payment_attempt_records

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - A limit on the number of objects to be returned. Default is 10, maximum is 100.
- **starting_after** (string) - Optional - A cursor for use in pagination. Fetch results after this record ID.
- **ending_before** (string) - Optional - A cursor for use in pagination. Fetch results before this record ID.

### Request Example
{
  "Note": "No request body for GET requests"
}

### Response
#### Success Response (200)
- **object** (string) - Value is 'list'.
- **data** (array) - A list containing Payment Attempt Record objects.
- **has_more** (boolean) - True if there are more objects in the list.
- **url** (string) - The URL for the list request.

#### Response Example
{
  "object": "list",
  "data": [
    {
      "id": "pat_12345",
      "object": "payment_attempt_record",
      "amount": 1000,
      "currency": "usd",
      "status": "succeeded",
      "livemode": false
    },
    {
      "id": "pat_67890",
      "object": "payment_attempt_record",
      "amount": 500,
      "currency": "eur",
      "status": "failed",
      "livemode": false
    }
  ],
  "has_more": false,
  "url": "/v1/payment_attempt_records"
}
```

--------------------------------

### GET /v1/radar/early_fraud_warnings

Source: https://docs.stripe.com/docs/api/subscriptions

List all early fraud warnings.

```APIDOC
## GET /v1/radar/early_fraud_warnings

### Description
List all early fraud warnings.

### Method
GET

### Endpoint
/v1/radar/early_fraud_warnings

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/api/issuing/authorizations/object_api-version=2024-12-18

Creates a SetupIntent to guide the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- No specific request body fields provided in the text.

### Request Example
{}

### Response
#### Success Response (200)
- No specific response fields provided in the text.

#### Response Example
{}
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/v2/money-management/financial-accounts/object_api-version=2025-04-30

Lists all SetupIntent objects, allowing for retrieval of multiple SetupIntents.

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. This endpoint lists all SetupIntent objects.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Example Stripe SetupIntent JSON Response

Source: https://docs.stripe.com/payments/paypal/set-up-future-payments

This JSON snippet provides an example structure of a Stripe `SetupIntent` object when its status is `requires_action`. It highlights the `next_action` property of type `redirect_to_url`, which contains the URL for the customer to complete authorization. This response indicates that further action is needed from the user to finalize the setup.

```json
{
  "id": "seti_1IQ9hjJJahOk1vSNevPWnhEN",
  "object": "setup_intent","status": "requires_action",
  "next_action": {
    "type": "redirect_to_url",
    "redirect_to_url": {
      "url": "https://hooks.stripe.com/...",
      "return_url": "https://example.com/setup/complete"
    }
  },
  "application": null,
  "cancellation_reason": null,
  "client_secret": "seti_1IQ9hjJJahOk1vSNevPWnhEN_secret_J2EAlI0GQbQKV9tg7ITRcUWRBiAwvUV",
  "created": 1614597263,
  "customer": null,
  "description": null,
  "last_setup_error": null,
  "latest_attempt": "setatt_1IQ9hkJJahOk1vSN0rsCpnLI",
  "livemode": false,
  "mandate": null,
  "metadata": {},
  "next_action": null,
  "on_behalf_of": null,
  "payment_method": "pm_1IQ9hjJJahOk1vSNDc5lQWia",
  "payment_method_options": {},
  "payment_method_types": ["paypal"],
  "single_use_mandate": null,
  "usage": "off_session"
}
```

--------------------------------

### Create a Price for a Product using Stripe CLI

Source: https://docs.stripe.com/development/quickstart

Defines a new price for an existing product using the Stripe CLI, specifying the unit amount, currency, and the product's unique identifier. Remember to replace the placeholder `{{PRODUCT_ID}}`.

```Command Line
stripe prices create \
  --unit-amount=3000 \
  --currency=usd \
  --product=
"{{PRODUCT_ID}}"
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/refunds/object_api-version=2024-10-28

Retrieves a list of all SetupIntents.

```APIDOC
## GET /v1/setup_intents

### Description
Retrieves a list of all SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
(No path parameters)

#### Query Parameters
(No query parameters)

#### Request Body
(No request body parameters documented)

### Request Example
{}

### Response
#### Success Response (200)
(No response fields documented)

#### Response Example
{}
```

--------------------------------

### Setup Stripe Customer, CustomerSession, and PaymentIntent

Source: https://docs.stripe.com/connect/end-to-end-saas-platform

These examples demonstrate how to create the necessary Stripe objects (Customer, CustomerSession, PaymentIntent) on the backend. This setup supports mobile payment elements and enables features like saving, redisplaying, and removing payment methods for the Payment Sheet. Replace placeholders with your actual keys and IDs.

```bash
# Create a Customer (use an existing Customer ID if this is a returning customer)
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -H "Stripe-Account: {{CONNECTED_ACCOUNT_ID}}"

# Create an CustomerSession for the Customer
curl https://api.stripe.com/v1/customer_sessions \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "components[mobile_payment_element][enabled]"=true \
  -d "components[mobile_payment_element][features][payment_method_save]"=enabled \
  -d "components[mobile_payment_element][features][payment_method_redisplay]"=enabled \
  -d "components[mobile_payment_element][features][payment_method_remove]"=enabled

# Create a PaymentIntent
curl https://api.stripe.com/v1/payment_intents \
  -u <<YOUR_SECRET_KEY>>: \
  -H "Stripe-Account: {{CONNECTED_ACCOUNT_ID}}"
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "amount"=1099 \
  -d "currency"="eur" \
  -d "payment_method_types[]"="bancontact" \
  -d "payment_method_types[]"="card" \
  -d "payment_method_types[]"="ideal" \
  -d "payment_method_types[]"="klarna" \
  -d "payment_method_types[]"="sepa_debit" \
  -d application_fee_amount="123"
```

```ruby
# This example sets up an endpoint using the Sinatra framework.



post '/payment-sheet' do
  # Use an existing Customer ID if this is a returning customer
  customer = Stripe::Customer.create({stripe_account: '{{CONNECTED_ACCOUNT_ID}}'})
  customerSession = Stripe::CustomerSession.create({
    customer: customer['id'],
    components: {
      mobile_payment_element: {
        enabled: true,
        features: {
          payment_method_save: 'enabled',
          payment_method_redisplay: 'enabled',
          payment_method_remove: 'enabled',
        },
      },
    },
  })
  paymentIntent = Stripe::PaymentIntent.create({
    amount: 1099,
    currency: 'eur',
    customer: customer['id'],
    payment_method_types: ['bancontact', 'card', 'ideal', 'klarna', 'sepa_debit'],
    application_fee_amount: 123,
  }, {stripe_account: '{{CONNECTED_ACCOUNT_ID}}'})
  {
    paymentIntent: paymentIntent['client_secret'],
    customerSessionClientSecret: customerSession['client_secret'],
    customer: customer['id'],
    publishableKey: '<<YOUR_PUBLISHABLE_KEY>>'
  }.to_json
end
```

--------------------------------

### Create Stripe SetupIntent for Revolut Pay

Source: https://docs.stripe.com/payments/revolut-pay/set-up-future-payments

These examples demonstrate how to create a Stripe SetupIntent on your server, specifying 'revolut_pay' as the payment method type. The setup intent is configured for 'off_session' usage and linked to a customer, preparing for future payments. Remember to replace `<<YOUR_SECRET_KEY>>` with your actual Stripe secret key and `{{CUSTOMER_ID}}` with a valid customer ID.

```ruby
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create({
  payment_method_types: ['revolut_pay'],
  payment_method_data: {type: 'revolut_pay'},
  usage: 'off_session',
  customer: '{{CUSTOMER_ID}}',
})
```

```python
# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
client = StripeClient("<<YOUR_SECRET_KEY>>")

# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
setup_intent = client.v1.setup_intents.create({
  "payment_method_types": ["revolut_pay"],
  "payment_method_data": {"type": "revolut_pay"},
  "usage": "off_session",
  "customer": "{{CUSTOMER_ID}}",
})
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$setupIntent = $stripe->setupIntents->create([
  'payment_method_types' => ['revolut_pay'],
  'payment_method_data' => ['type' => 'revolut_pay'],
  'usage' => 'off_session',
  'customer' => '{{CUSTOMER_ID}}',
]);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SetupIntentCreateParams params =
  SetupIntentCreateParams.builder()
    .addPaymentMethodType("revolut_pay")
    .setPaymentMethodData(
      SetupIntentCreateParams.PaymentMethodData.builder()
        .setType(SetupIntentCreateParams.PaymentMethodData.Type.REVOLUT_PAY)
        .build()
    )
    .setUsage(SetupIntentCreateParams.Usage.OFF_SESSION)
    .setCustomer("{{CUSTOMER_ID}}")
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
SetupIntent setupIntent = client.v1().setupIntents().create(params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntent = await stripe.setupIntents.create({
  payment_method_types: ['revolut_pay'],
  payment_method_data: {
    type: 'revolut_pay',
  },
  usage: 'off_session',
  customer: '{{CUSTOMER_ID}}',
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SetupIntentCreateParams{
  PaymentMethodTypes: []*string{stripe.String("revolut_pay")},
  PaymentMethodData: &stripe.SetupIntentCreatePaymentMethodDataParams{
    Type: stripe.String("revolut_pay"),
  },
  Usage: stripe.String(stripe.SetupIntentUsageOffSession),
  Customer: stripe.String("{{CUSTOMER_ID}}"),
}
result, err := sc.V1SetupIntents.Create(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SetupIntentCreateOptions
{
    PaymentMethodTypes = new List<string> { "revolut_pay" },
    PaymentMethodData = new SetupIntentPaymentMethodDataOptions { Type = "revolut_pay" },
    Usage = "off_session",
    Customer = "{{CUSTOMER_ID}}",
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options);
```

--------------------------------

### Create a Stripe SetupIntent (C#)

Source: https://docs.stripe.com/payments/acss-debit/set-up-payment

This snippet demonstrates how to initialize the Stripe client and create a SetupIntent object using the Stripe .NET SDK. The SetupIntent is a core Stripe object used to collect payment method details for future use.

```csharp
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options);
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/confirmation_tokens/object_api-version=2024-10-28

Returns a list of all SetupIntents, allowing for pagination and filtering.

```APIDOC
## GET /v1/setup_intents

### Description
Returns a list of all SetupIntents, allowing for pagination and filtering.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
No path parameters.

#### Query Parameters
No specific details provided in the input.

#### Request Body
No request body.

### Request Example
{}

### Response
#### Success Response (200)
No specific details provided in the input.

#### Response Example
{}
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/setup_intents/create_api-version=2024-11-20

Lists all SetupIntents, allowing you to retrieve multiple SetupIntents at once. This can be useful for auditing or reviewing all payment setup attempts.

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
N/A

#### Query Parameters
Not explicitly provided in the text. Common query parameters for listing include `limit`, `starting_after`, `ending_before`, `customer`, and `status`.

#### Request Body
N/A

### Request Example
N/A

### Response
#### Success Response (200)
An object containing a `data` array of SetupIntent objects and a `has_more` boolean indicating if more results are available.
- **data** (array) - A list of SetupIntent objects.
  - **id** (string) - Unique identifier for the object.
  - **automatic_payment_methods** (Map) - Settings for dynamic payment methods.
  - **client_secret** (string) - The client secret of this SetupIntent.
  - **customer** (string) - ID of the Customer this SetupIntent belongs to.
  - **description** (string) - An arbitrary string attached to the object.
  - **last_setup_error** (Map) - The error encountered.
  - **metadata** (Map) - Set of key-value pairs.
  - **next_action** (Map) - Actions needed for customer.
  - **payment_method** (string) - ID of the payment method.
  - **status** (enum) - Status of this SetupIntent.
  - **usage** (string) - Indicates how the payment method is intended to be used.
- **has_more** (boolean) - True if there are more SetupIntents to retrieve.
- **url** (string) - The URL path for the request.

#### Response Example
```json
{
  "object": "list",
  "data": [
    {
      "id": "seti_1Oe9t82eZvKYlo2CIZJ6c3lT",
      "object": "setup_intent",
      "automatic_payment_methods": {
        "enabled": true
      },
      "client_secret": "seti_1Oe9t82eZvKYlo2CIZJ6c3lT_secret_PsK7zKxO9t0Xk0K0N0Y0V0L0a0s0",
      "customer": "cus_ABCDEF12345678",
      "description": "SetupIntent for future payments on example.com",
      "last_setup_error": null,
      "livemode": false,
      "metadata": {
        "order_id": "67890"
      },
      "next_action": null,
      "payment_method": "pm_XYZABC",
      "status": "succeeded",
      "usage": "off_session"
    },
    {
      "id": "seti_2Pe9t82eZvKYlo2CIZJ6c3lQ",
      "object": "setup_intent",
      "automatic_payment_methods": {
        "enabled": true
      },
      "client_secret": "seti_2Pe9t82eZvKYlo2CIZJ6c3lQ_secret_QzK8zKxO9t0Xk0K0N0Y0V0L0a0s0",
      "customer": "cus_XYZABC98765432",
      "description": "Another SetupIntent",
      "last_setup_error": null,
      "livemode": false,
      "metadata": {},
      "next_action": null,
      "payment_method": null,
      "status": "requires_payment_method",
      "usage": "on_session"
    }
  ],
  "has_more": false,
  "url": "/v1/setup_intents"
}
```
```

--------------------------------

### Create Customer and Subscription with Legacy Token (Server-side)

Source: https://docs.stripe.com/payments/checkout/migration

These examples demonstrate the server-side logic for creating a Stripe customer and a subscription using a `stripeToken` obtained from the legacy Stripe Checkout. Each example shows how to associate the customer with an email and a payment source, then create a subscription with a specified price and trial period.

```bash
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -d "email"="customer@example.com" \
  -d "source"="{{STRIPE_TOKEN}}"
curl https://api.stripe.com/v1/subscriptions \
  -u <<YOUR_SECRET_KEY>>: \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "items[0][price]"="{PRICE_ID}" \
  -d "trial_period_days"=30
```

```ruby
customer = Stripe::Customer.create({
  email: 'customer@example.com',
  source: data['stripeToken'],
})

subscription = Stripe::Subscription.create({
  customer: customer.id,
  items: [{
    price: '{PRICE_ID}',
  }],
  trial_period_days: 30,
})
```

```python
customer = stripe.Customer.create(
  email='customer@example.com',
  source=data['stripeToken'],
)

subscription = stripe.Subscription.create(
  customer=customer.id,
  items=[{
    'price': '{PRICE_ID}',
  }],
  trial_period_days=30,
)
```

```php
$customer = \Stripe\Customer::create([
  'email' => 'customer@example.com',
  'source' => $_POST['stripeToken'],
]);

$subscription = \Stripe\Subscription::create([
  'customer' => $customer->id,
  'items' => [[
    'price' => '{PRICE_ID}',
  ]],
  'trial_period_days' => 30,
]);
```

```java
Map<String, Object> customerParams = new HashMap<String, Object>();
customerParams.put("email", "customer@example.com");
customerParams.put("source", request.stripeToken);
Customer customer = Customer.create(customerParams);

Map<String, Object> subscriptionParams = new HashMap<String, Object>();
subscriptionParams.put("customer", customer.id);
HashMap<String, Object> items = new HashMap<String, Object>();
HashMap<String, Object> item = new HashMap<String, Object>();
item.put("price", "{PRICE_ID}");
items.put("0", item);
subscriptionParams.put("items", items);
subscriptionParams.put("trial_period_days", 30);
Subscription subscription = Subscription.create(subscriptionParams);
```

```javascript
const customer = await stripe.customers.create({
  email: 'customer@example.com',
  source: request.body.stripeToken,
});

const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{
    price: '{PRICE_ID}',
  }],
  trial_period_days: 30,
});
```

```go
customerParams := &stripe.CustomerParams{
    Email: stripe.String("customer@example.com"),
}
customerParams.SetSource(*request.stripeToken)
customer, _ := customer.New(customerParams)

subscriptionParams := &stripe.SubscriptionParams{
    Customer: stripe.String(customer.Id),
    Items: []*stripe.SubscriptionItemsParams{
        &stripe.SubscriptionItemsParams{
            Price: stripe.String("{PRICE_ID}"),
        },
    },
    TrialPeriodDays: stripe.Int64(30),
}
subscription, _ := subscription.New(subscriptionParams)
```

```csharp
var customerOptions = new CustomerCreateOptions
{
    Email = "customer@example.com",
    Source = request.stripeToken,
};
var customerService = new CustomerService();
var customer = customerService.Create(customerOptions);

var subscriptionOptions = new SubscriptionCreateOptions
{
    Customer = customer.Id,
    Items = new List<SubscriptionItemOptions>
    {
        new SubscriptionItemOptions
        {
            Price = "{PRICE_ID}",
        },
    },
    TrialPeriodDays = 30,
};
var subscriptionService = new SubscriptionService();
var subscription = subscriptionService.Create(subscriptionOptions);
```

--------------------------------

### Create Stripe SetupIntent (Kotlin & Java)

Source: https://docs.stripe.com/terminal/features/mail-telephone-orders/save-directly

These examples show how to create a SetupIntent, an object representing the intent to set up a customer's payment method for future use, specifically for card payments. The code sets customer ID, optional on-behalf-of account, description, and specifies 'card' as the payment method type. Callbacks are provided to handle successful creation or failures.

```kotlin
val params = SetupIntentParameters.Builder()
    .setCustomer("{{CUSTOMER_ID}}")
    .setOnBehalfOf("{{ON_BEHALF_OF}}")
    .setDescription("Customer A's Card")
    .setPaymentMethodTypes(listOf(PaymentMethodType.CARD))
    .build()

Terminal.getInstance().createSetupIntent(params, object : SetupIntentCallback {
    override fun onSuccess(setupIntent: SetupIntent) {
        // Placeholder for handling successful operation
    }

    override fun onFailure(e: TerminalException) {
        // Placeholder for handling exception
    }
})
```

```java
SetupIntentParameters params = new SetupIntentParameters.Builder()
    .setCustomer("{{CUSTOMER_ID}}")
    .setOnBehalfOf("{{ON_BEHALF_OF}}")
    .setDescription("Customer A's Card")
    .setPaymentMethodTypes(Arrays.asList(PaymentMethodType.CARD))
    .build();

Terminal.getInstance().createSetupIntent(params, new SetupIntentCallback() {
    @Override
    public void onSuccess(@NotNull SetupIntent setupIntent) {
        // Placeholder for handling successful operation
    }

    @Override
    public void onFailure(@NotNull TerminalException e) {
        // Placeholder for handling exception
    }
});
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/payments/acss-debit/set-up-payment

Retrieves a list of Setup Intents associated with a specific customer. This is useful for finding PaymentMethods and Mandates to charge customers off-session.

```APIDOC
## GET /v1/setup_intents

### Description
Retrieves a list of Setup Intents associated with a specific customer. This endpoint is typically used to find PaymentMethods and Mandates when preparing to charge a customer off-session, especially if the SetupIntent ID was not captured previously.

### Method
GET

### Endpoint
https://api.stripe.com/v1/setup_intents

### Parameters
#### Query Parameters
- **customer** (string) - Required - The ID of the customer whose Setup Intents are to be listed.

### Request Example
```curl
curl -G https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer="{{CUSTOMER_ID}}"
```

### Response
#### Success Response (200)
A JSON object containing a list of SetupIntent objects. Each object includes details like `id`, `object`, `status`, `payment_method`, `mandate`, etc.

#### Response Example
```json
{
  "object": "list",
  "data": [
    {
      "id": "si_12345",
      "object": "setup_intent",
      "livemode": false,
      "status": "succeeded",
      "customer": "cus_12345",
      "payment_method": "pm_12345",
      "mandate": "mandate_12345",
      "usage": "off_session",
      "created": 1678886400,
      "description": null
    }
  ],
  "has_more": false,
  "url": "/v1/setup_intents"
}
```
```

--------------------------------

### Create Stripe SetupIntent in C#

Source: https://docs.stripe.com/payments/paypal/set-up-future-payments

This C# code demonstrates how to create a Stripe SetupIntent using the Stripe .NET client library. It configures the SetupIntent with user details, an IP address, and a return URL for post-authorization redirects. The code initializes a `StripeClient` with a secret key and then calls the `Create` method on the `SetupIntents` service.

```csharp
IpAddress = "{{IP_ADDRESS}}",
                UserAgent = "{{USER_AGENT}}",
            },
        },
    },
    Confirm = true,
    ReturnUrl = "https://example.com/setup/complete",
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options);
```

--------------------------------

### Handle Load Errors in Stripe Embedded Components (Kotlin, Java)

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

This code snippet demonstrates how to implement an `onLoadError` listener for Stripe Connect embedded components, using `AccountOnboardingController` as an example. The listener catches `Throwable` objects, allowing the application to react to component loading failures. Logic within `onLoadError` should be idempotent as it may be called multiple times.

```kotlin
// All components emit load errors. This example uses AccountOnboarding.
// All components support onLoadError.
class MyActivity : FragmentActivity() {
    private lateinit var accountOnboardingController: AccountOnboardingController

    override fun onCreate(savedInstanceState: Bundle?) {
        accountOnboardingController =
            embeddedComponentManager.createAccountOnboardingController(this)
        accountOnboardingController.listener = MyAccountOnboardingListener()
    }

    private fun openAccountOnboarding() {
        accountOnboardingController.show()
    }

    private inner class MyAccountOnboardingListener : AccountOnboardingListener {
        override fun onLoadError(error: Throwable) {
            println("Error loading account onboarding: ${error.message}")
        }
    }
}
```

```java
// All components emit load errors. This example uses AccountOnboarding.
// All components support onLoadError.
public class MyActivity extends FragmentActivity {
    private AccountOnboardingController accountOnboardingController;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        accountOnboardingController =
            embeddedComponentManager.createAccountOnboardingController(this);
        accountOnboardingController.setListener(new MyAccountOnboardingListener());
    }

    private void openAccountOnboarding() {
        accountOnboardingController.show();
    }

    class MyAccountOnboardingListener implements AccountOnboardingListener {
        @Override
        public void onLoadError(@NonNull Throwable error) {
            System.out.println("Error loading account onboarding: ${error.message}");
        }
    }
}
```

--------------------------------

### GET /v1/setup_attempts

Source: https://docs.stripe.com/api/tax/calculations/create_api-version=2025-05-28

Lists all SetupAttempt objects, providing details of specific attempts at setting up a payment method using a SetupIntent.

```APIDOC
## GET /v1/setup_attempts

### Description
Lists all SetupAttempt objects, providing details of specific attempts at setting up a payment method using a SetupIntent.

### Method
GET

### Endpoint
/v1/setup_attempts

### Parameters
#### Path Parameters
- No path parameters for this endpoint.

#### Query Parameters
- No query parameters provided in the source text.

#### Request Body
- No request body parameters for GET requests.

### Request Example
{
  "message": "No request body for GET request."
}

### Response
#### Success Response (200)
- No success response fields provided in the source text.

#### Response Example
{
  "message": "Response example not provided in the source text."
}
```

--------------------------------

### Render Stripe Account Onboarding Controller in Android Activity

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components_platform=android

To display an Account Onboarding component, first call `EmbeddedComponentManager.onActivityCreate()` in your Activity's `onCreate` method. Then, create an `AccountOnboardingController` using the `EmbeddedComponentManager` instance from your ViewModel and call its `show()` method to present the onboarding flow.

```Kotlin
class MyActivity : FragmentActivity() {
    private val viewModel: MyActivityViewModel by viewModels()
    private lateinit var accountOnboardingController: AccountOnboardingController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        EmbeddedComponentManager.onActivityCreate(this)
        setContentView(R.layout.my_activity)

        accountOnboardingController =
            viewModel.embeddedComponentManager.createAccountOnboardingController(this)
    }

    private fun openAccountOnboarding() {
        accountOnboardingController.show()
    }
}
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/api/tax/calculations/create_api-version=2025-05-28

Creates a SetupIntent, which guides you through the process of setting up and saving a customer's payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a SetupIntent, which guides you through the process of setting up and saving a customer's payment credentials for future payments.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- No path parameters for this endpoint.

#### Query Parameters
- No query parameters provided in the source text.

#### Request Body
- No request body parameters provided in the source text.

### Request Example
{
  "message": "Request body structure not provided in the source text."
}

### Response
#### Success Response (200)
- No success response fields provided in the source text.

#### Response Example
{
  "message": "Response example not provided in the source text."
}
```

--------------------------------

### Handle Stripe Client Secret in Backend (Go, .NET C#)

Source: https://docs.stripe.com/billing/subscriptions/amazon-pay

These server-side code examples illustrate how to fetch or create a Stripe SetupIntent and expose its `ClientSecret` to the frontend. The Go example uses `html/template` and `net/http`, while the C# example uses ASP.NET Core MVC `ViewData` for passing data to the view.

```go
package main

import (
  "html/template"
  "net/http"

  stripe "github.com/stripe/stripe-go/v76.0.0"
)

type CheckoutData struct {
  ClientSecret string
}

func main() {
  checkoutTmpl := template.Must(template.ParseFiles("views/checkout.html"))

  http.HandleFunc("/checkout", func(w http.ResponseWriter, r *http.Request) {
    intent := // ... Fetch or create the SetupIntent
    data := CheckoutData{
      ClientSecret: intent.ClientSecret,
    }
    checkoutTmpl.Execute(w, data)
  })

  http.ListenAndServe(":3000", nil)
}
```

```csharp
using System;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace StripeExampleApi.Controllers
{
  [Route("/[controller]")]
  public class CheckoutApiController : Controller
  {
    public IActionResult Index()
    {
      var intent = // ... Fetch or create the SetupIntent
      ViewData["ClientSecret"] = intent.ClientSecret;
      return View();
    }
  }
}
```

--------------------------------

### Create Stripe Setup Intent (Go, C#)

Source: https://docs.stripe.com/payments/mobile/finalize-payments-on-the-server

This code demonstrates how to create a Stripe Setup Intent on your server. A Setup Intent is an object that represents your intent to set up a customer's payment method for future payments. It includes parameters for the customer, payment method ID, return URL, and mandate data for customer acceptance. The server then returns the client secret to the client-side.

```go
package main

import (
  "encoding/json"
  "net/http"

  "github.com/stripe/stripe-go/v76.0.0"
  "github.com/stripe/stripe-go/v76.0.0/setupintent"
)

type CheckoutData struct {
  ClientSecret string `json:"client_secret"`
}

func main() {
  stripe.Key = "<<YOUR_SECRET_KEY>>"

  http.HandleFunc("/create-intent", func(w http.ResponseWriter, r *http.Request) {
    var req struct {
      PaymentMethodID string `json:"payment_method_id"`
      ShouldSavePaymentMethod bool `json:"should_save_payment_method"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      //log.Printf("json.NewDecoder.Decode: %v", err) // Assuming log is imported
      return
    }
    params := &stripe.SetupIntentParams{
      // Customer: stripe.String(c.ID), // The Customer ID you previously created - c.ID is not defined here
      Customer: stripe.String("cus_YOUR_CUSTOMER_ID"),
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      AutomaticPaymentMethods: &stripe.SetupIntentAutomaticPaymentMethodsParams{
        Enabled: stripe.Bool(true),
      },
      Confirm: stripe.Bool(true),
      PaymentMethod: stripe.String(req.PaymentMethodID), // the PaymentMethod ID sent by your client
      ReturnURL: stripe.String(string("stripesdk://payment_return_url/com.company.myapp")), // Set this to "stripesdk://payment_return_url/" + your application ID
      MandateData: &stripe.SetupIntentMandateDataParams{
        CustomerAcceptance: &stripe.SetupIntentMandateDataCustomerAcceptanceParams{
          Type: stripe.String("online"),
          Online: &stripe.SetupIntentMandateDataCustomerAcceptanceOnlineParams{
            IPAddress: stripe.String("127.0.0.1"), // your client's IP address
            UserAgent: stripe.String(r.UserAgent()),
          },
        },
      },
    }
    intent, err := setupintent.New(params);
    if err == nil {
      w.Header().Set("Content-Type", "application/json")
      w.WriteHeader(http.StatusOK)
      data := CheckoutData{
        ClientSecret: intent.ClientSecret,
      }
      json.NewEncoder(w).Encode(data)
    } else {
      if stripeErr, ok := err.(*stripe.Error); ok {
        switch stripeErr.Type {
          case stripe.ErrorTypeCard:
            http.Error(w, stripeErr.Msg, http.StatusInternalServerError)
          default:
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
      } else {
        http.Error(w, err.Error(), http.StatusInternalServerError)
      }
    }
  })

  http.ListenAndServe(":4242", nil)
}
```

```csharp
using System;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Newtonsoft.Json; // Assuming Newtonsoft.Json for JsonProperty

namespace StripeExampleApi.Controllers
{
  [Route("create-intent")]
  [ApiController]
  public class CheckoutApiController : Controller
  {
    public CheckoutApiController()
    {
      StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";
    }

    [HttpPost]
    public ActionResult Post([FromBody]IntentCreateRequest request)
    {
      var options = new SetupIntentCreateOptions()
      {
        // Customer = customer.Id, // The Customer ID you previously created - customer.Id is not defined here
        Customer = "cus_YOUR_CUSTOMER_ID",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        AutomaticPaymentMethods = new SetupIntentAutomaticPaymentMethodsOptions
        {
          Enabled = true,
        },
        Confirm = true,
        PaymentMethod = request.PaymentMethodId, // the PaymentMethod ID sent by your client
        ReturnUrl = "stripesdk://payment_return_url/com.company.myapp", // Set this to "stripesdk://payment_return_url/" + your application ID
        MandateData = new SetupIntentMandateDataOptions // Changed from PaymentIntentMandateDataOptions
        {
          CustomerAcceptance = new SetupIntentMandateDataCustomerAcceptanceOptions // Changed from PaymentIntentMandateDataCustomerAcceptanceOptions
          {
            Type = "online",
            Online = new SetupIntentMandateDataCustomerAcceptanceOnlineOptions // Changed from PaymentIntentMandateDataCustomerAcceptanceOnlineOptions
            {
              IpAddress = "127.0.0.1", /* The client's IP address*/
              UserAgent = Request.Headers["User-Agent"].ToString()
            }
          },
        },
      };
      var service = new SetupIntentService();
      try
      {
        SetupIntent intent = service.Create(options);
        return Json(new { client_secret = intent.ClientSecret });
      }
      catch (StripeException e)
      {
        this.HttpContext.Response.StatusCode = 400;
        switch (e.StripeError.Type)
        {
          case "card_error":
            return Json(new { error = e.Message }); // For card errors, the message can be shown to your users
          default:
            return Json(new { error = e.Message }); // Other errors may not be localized
        }
      }
    }

    public class IntentCreateRequest
    {
      [JsonProperty("payment_method_id")]
      public string PaymentMethodId { get; set; }
      [JsonProperty("should_save_payment_method")]
      public bool ShouldSavePaymentMethod { get; set; }
    }
  }
}
```

--------------------------------

### Install Stripe Ruby library

Source: https://docs.stripe.com/billing/subscriptions/klarna

Install the Stripe client library for Ruby projects. You can install it directly as a gem using the command line or add it to your Gemfile if you are using Bundler for dependency management.

```bash
sudo gem install stripe
```

```ruby
gem 'stripe'
```

--------------------------------

### Create Stripe Product in Python, PHP, Java, Node.js, Go, and C#

Source: https://docs.stripe.com/billing/subscriptions/usage-based/use-cases/credits-based-pricing-model

This code demonstrates how to create a new product object in Stripe using various SDKs. It defines the product's name and a brief description. Users need to replace `<<YOUR_SECRET_KEY>>` with their actual Stripe secret key and be aware of SDK version compatibility for the API call.

```python
# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
product = client.v1.products.create({
  "description": "Ouput usage fee for Alpaca AI",
  "name": "Alpaca AI Output Usage",
})
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$product = $stripe->products->create([
  'description' => 'Ouput usage fee for Alpaca AI',
  'name' => 'Alpaca AI Output Usage',
]);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

ProductCreateParams params =
  ProductCreateParams.builder()
    .setDescription("Ouput usage fee for Alpaca AI")
    .setName("Alpaca AI Output Usage")
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
Product product = client.v1().products().create(params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const product = await stripe.products.create({
  description: 'Ouput usage fee for Alpaca AI',
  name: 'Alpaca AI Output Usage',
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.ProductCreateParams{
  Description: stripe.String("Ouput usage fee for Alpaca AI"),
  Name: stripe.String("Alpaca AI Output Usage"),
}
result, err := sc.V1Products.Create(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new ProductCreateOptions
{
    Description = "Ouput usage fee for Alpaca AI",
    Name = "Alpaca AI Output Usage",
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.Products;
Product product = service.Create(options);
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/terminal/readers_api-version=2025-10-29

Returns a list of SetupIntents. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## GET /v1/setup_intents

### Description
Returns a list of SetupIntents. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **customer** (string) - Optional - Only return SetupIntents for the customer with this ID.
- **limit** (integer) - Optional - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
- **starting_after** (string) - Optional - A cursor for use in pagination.

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **object** (string) - Value is 'list'.
- **data** (array) - A list of SetupIntent objects.
- **has_more** (boolean) - True if this list has more items to retrieve.

#### Response Example
{
  "object": "list",
  "data": [
    {
      "id": "seti_12345",
      "object": "setup_intent",
      "livemode": false,
      "status": "succeeded"
    }
  ],
  "has_more": false
}
```

--------------------------------

### Initialize Stripe Node.js SDK

Source: https://docs.stripe.com/sdks/server-side

Example of initializing the Stripe Node.js SDK by requiring the library and providing your secret API key directly.

```javascript
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');
```

--------------------------------

### Create a Stripe Setup Intent for Card Payments

Source: https://docs.stripe.com/api/setup_intents/create

These examples demonstrate how to create a Stripe Setup Intent, specifying 'card' as the payment method type. A Setup Intent is used to set up a customer's payment method for future payments without immediately charging them. Ensure you replace `<<YOUR_SECRET_KEY>>` with your actual Stripe secret key.

```curl
curl https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>" \
  -d "payment_method_types[]"=card
```

```cli
stripe setup_intents create  \
  -d "payment_method_types[0]"=card
```

```ruby
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create({payment_method_types: ['card']})
```

```python
client = StripeClient("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create({"payment_method_types": ["card"]})
```

```php
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$setupIntent = $stripe->setupIntents->create(['payment_method_types' => ['card']]);
```

```java
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SetupIntentCreateParams params =
  SetupIntentCreateParams.builder().addPaymentMethodType("card").build();

SetupIntent setupIntent = client.v1().setupIntents().create(params);
```

```node
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntent = await stripe.setupIntents.create({
  payment_method_types: ['card'],
});
```

```go
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SetupIntentCreateParams{
  PaymentMethodTypes: []*string{stripe.String("card")},
}
result, err := sc.V1SetupIntents.Create(context.TODO(), params)
```

```dotnet
var options = new SetupIntentCreateOptions
{
    PaymentMethodTypes = new List<string> { "card" },
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options);
```

--------------------------------

### Execute Ruby Script to Create Stripe Resources

Source: https://docs.stripe.com/development/quickstart

Run this command in your terminal to execute the `create_price.rb` Ruby script, which will make API calls to create a Stripe Product and Price.

```Command Line
ruby create_price.rb
```

--------------------------------

### GET /v1/reviews/:id

Source: https://docs.stripe.com/docs/api/subscriptions

Retrieve details of a specific review.

```APIDOC
## GET /v1/reviews/:id

### Description
Retrieve details of a specific review.

### Method
GET

### Endpoint
/v1/reviews/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the review.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/billing/credit-balance-summary/object_api-version=2024-10-28

Endpoints related to SetupIntents, which guide the process of setting up and saving a customer's payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a SetupIntent object. A SetupIntent guides you through the process of setting up and saving a customer's payment credentials for future payments.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates an existing SetupIntent object.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves the details of a SetupIntent.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## GET /v1/setup_intents

### Description
Returns a list of SetupIntents.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies microdeposits for a SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent for which to verify microdeposits.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Create a Stripe SetupIntent (Server-side) in Ruby and Python

Source: https://docs.stripe.com/payments/accept-a-payment-deferred

This server-side code illustrates how to create a Stripe SetupIntent, which is crucial for collecting payment method details for future payments. It shows how to provide a customer ID and enable automatic payment methods, returning the `client_secret` to the client-side for secure setup completion. The examples include basic Flask server setup for Python and a Ruby endpoint.

```ruby
require 'stripe'
Stripe.api_key = '<<YOUR_SECRET_KEY>>'

post '/create-intent' do
  # If you used a Tax Calculation, optionally recalculate taxes
  # confirmation_token = Stripe::ConfirmationToken.retrieve(params[:confirmation_token_id])
  # summarized_payment_details = summarize_payment_details(confirmation_token)

  intent = Stripe::SetupIntent.create({
    # To allow saving and retrieving payment methods, provide the Customer ID.
    customer: customer.id,
    # Specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {enabled: true},
    # If you used a Tax Calculation, link it to the PaymentIntent to make sure any transitions accurately reflect the tax.
    # hooks: {
    #  inputs: {
    #    tax: {
    #      calculation: tax_calculation.id
    #    }
    #  }
    #}
  },
  #{
  #  stripe_version: '2025-09-30.preview' }
  )
  {client_secret: intent.client_secret}.to_json
end
```

```python
import stripe
from flask import Flask, jsonify, request
app = Flask(__name__)
stripe.api_key = "<<YOUR_SECRET_KEY>>"

@app.route('/create-intent', methods=['POST'])
def createIntent():
  # If you used a Tax Calculation, optionally recalculate taxes
  #confirmation_token = stripe.ConfirmationToken.retrieve(request.json['confirmation_token_id'])
  #summarized_payment_details = summarize_payment_details(confirmation_token)

  intent = stripe.SetupIntent.create(
    # To allow saving and retrieving payment methods, provide the Customer ID.
    customer=customer['id'],
    # Specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods={
      'enabled': True,
    },
    # If you used a Tax Calculation, link it to the PaymentIntent to make sure any transitions accurately reflect the tax.
    #hooks={
    #  'inputs': {
    #    'tax': {
    #      'calculation': tax_calculation.id
    #    }
    #  }
    #},
    #stripe_version='2025-09-30.preview'
  )
  return jsonify(client_secret=intent.client_secret)
```

--------------------------------

### GET /v1/payment_intents

Source: https://docs.stripe.com/api/setup_attempts/object_api-version=2025-03-31

Lists all PaymentIntents. A PaymentIntent guides you through the process of collecting a payment from your customer.

```APIDOC
## GET /v1/payment_intents

### Description
Lists all PaymentIntents.

### Method
GET

### Endpoint
/v1/payment_intents

### Parameters

```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/issuing/cards/update_api-version=2025-08-27

Returns a list of your SetupIntents. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## GET /v1/setup_intents

### Description
Returns a list of your SetupIntents. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **limit** (integer) - Optional - A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
- **starting_after** (string) - Optional - A cursor for use in pagination. `starting_after` is an object ID that defines your place in the list.
- **ending_before** (string) - Optional - A cursor for use in pagination. `ending_before` is an object ID that defines your place in the list.

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **data** (array) - A list of SetupIntent objects.
- **has_more** (boolean) - True if there are more objects in the list.

#### Response Example
{
  "object": "list",
  "data": [
    {
      "id": "seti_12345",
      "object": "setup_intent",
      "status": "succeeded"
    },
    {
      "id": "seti_67890",
      "object": "setup_intent",
      "status": "requires_confirmation"
    }
  ],
  "has_more": false,
  "url": "/v1/setup_intents"
}
```

--------------------------------

### Install Stripe Server-side Library

Source: https://docs.stripe.com/payments/revolut-pay/set-up-future-payments

These code snippets provide instructions for installing the official Stripe API client libraries for various server-side programming languages. Installation methods include package managers like RubyGems, pip, Composer, Gradle, and Maven. Ensure you consult the respective documentation for specific versioning and dependency management best practices.

```ruby
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

```python
# Install through pip
pip3 install --upgrade stripe
```

```python
# Or find the Stripe package on http://pypi.python.org/pypi/stripe/
```

```python
# Find the version you want to pin:
# https://github.com/stripe/stripe-python/blob/master/CHANGELOG.md
# Specify that version in your requirements.txt file
stripe>=5.0.0
```

```php
# Install the PHP library with Composer
composer require stripe/stripe-php
```

```php
# Or download the source directly: https://github.com/stripe/stripe-php/releases
```

```java
/*
  For Gradle, add the following dependency to your build.gradle and replace with
  the version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
*/
implementation "com.stripe:stripe-java:30.0.0"
```

```java
<!--
  For Maven, add the following dependency to your POM and replace with the
  version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
-->
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>30.0.0</version>
</dependency>
```

```bash
# For other environments, manually install the following JARs:
# - The Stripe JAR from https://github.com/stripe/stripe-java/releases/latest
```

--------------------------------

### Install Stripe Go Server-Side SDK

Source: https://docs.stripe.com/get-started/development-environment

This command uses Go modules to install the Stripe Go server-side SDK, fetching version 83 from GitHub. After execution, the library will be added as a dependency in your project's `go.mod` file, enabling your Go application to interact with the Stripe API.

```bash
go get github.com/stripe/stripe-go/v83
```

--------------------------------

### Update Stripe Setup Intent with Mandate Expansion (Multi-language)

Source: https://docs.stripe.com/billing/subscriptions/au-becs-debit

These code examples demonstrate how to update an existing Stripe Setup Intent. The update operation includes expanding the 'mandate' object, which is useful for retrieving detailed information about the mandate associated with the intent. Each example shows client initialization and the specific API call using different programming languages.

```python
# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
setup_intent = client.v1.setup_intents.update(
  "{{SETUP_INTENT_ID}}",
  {"expand": ["mandate"]},
)
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$setupIntent = $stripe->setupIntents->update(
  '{{SETUP_INTENT_ID}}',
  ['expand' => ['mandate']]
);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SetupIntentUpdateParams params =
  SetupIntentUpdateParams.builder().addExpand("mandate").build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
SetupIntent setupIntent =
  client.v1().setupIntents().update("{{SETUP_INTENT_ID}}", params);
```

```node
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntent = await stripe.setupIntents.update(
  '{{SETUP_INTENT_ID}}',
  {
    expand: ['mandate'],
  }
);
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SetupIntentUpdateParams{Intent: stripe.String("{{SETUP_INTENT_ID}}")}
params.AddExpand("mandate")
result, err := sc.V1SetupIntents.Update(context.TODO(), params)
```

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SetupIntentUpdateOptions { Expand = new List<string> { "mandate" } };
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Update("{{SETUP_INTENT_ID}}", options);
```

--------------------------------

### Create Stripe Payment Intent with Card Installments

Source: https://docs.stripe.com/payments/jp-installments/accept-a-payment

These code examples demonstrate how to programmatically create a Stripe Payment Intent. The intent is configured with a specific amount and currency (JPY in this case), and crucially, it enables card installment options for the payment, requiring your Stripe secret key for authentication.

```ruby
payment_intent = client.v1.payment_intents.create({
  "amount": 3099,
  "currency": "jpy",
  "payment_method_options": {"card": {"installments": {"enabled": True}}},
})
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$paymentIntent = $stripe->paymentIntents->create([
  'amount' => 3099,
  'currency' => 'jpy',
  'payment_method_options' => ['card' => ['installments' => ['enabled' => true]]],
]);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

PaymentIntentCreateParams params =
  PaymentIntentCreateParams.builder()
    .setAmount(3099L)
    .setCurrency("jpy")
    .setPaymentMethodOptions(
      PaymentIntentCreateParams.PaymentMethodOptions.builder()
        .setCard(
          PaymentIntentCreateParams.PaymentMethodOptions.Card.builder()
            .setInstallments(
              PaymentIntentCreateParams.PaymentMethodOptions.Card.Installments.builder()
                .setEnabled(true)
                .build()
            )
            .build()
        )
        .build()
    )
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
PaymentIntent paymentIntent = client.v1().paymentIntents().create(params);
```

```javascript
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const paymentIntent = await stripe.paymentIntents.create({
  amount: 3099,
  currency: 'jpy',
  payment_method_options: {
    card: {
      installments: {
        enabled: true,
      },
    },
  },
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.PaymentIntentCreateParams{
  Amount: stripe.Int64(3099),
  Currency: stripe.String(stripe.CurrencyJPY),
  PaymentMethodOptions: &stripe.PaymentIntentCreatePaymentMethodOptionsParams{
    Card: &stripe.PaymentIntentCreatePaymentMethodOptionsCardParams{
      Installments: &stripe.PaymentIntentCreatePaymentMethodOptionsCardInstallmentsParams{
        Enabled: stripe.Bool(true),
      },
    },
  },
}
result, err := sc.V1PaymentIntents.Create(context.TODO(), params);
```

```csharp
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new PaymentIntentCreateOptions
{
    Amount = 3099,
    Currency = "jpy",
    PaymentMethodOptions = new PaymentIntentPaymentMethodOptionsOptions
    {
        Card = new PaymentIntentPaymentMethodOptionsCardOptions
        {
            Installments = new PaymentIntentPaymentMethodOptionsCardInstallmentsOptions
            {
                Enabled = true,
            },
        },
    },
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.PaymentIntents;
PaymentIntent paymentIntent = service.Create(options);
```

--------------------------------

### Initiating Stripe Connect Onboarding in Android with OkHttpClient

Source: https://docs.stripe.com/connect/end-to-end-saas-platform

This Java code snippet demonstrates how an Android application initiates the Stripe Connect onboarding process. It makes an asynchronous HTTP POST request using `OkHttpClient` to a backend endpoint (`/onboard-user`) to obtain a Stripe Connect URL. Upon receiving a successful response, it parses the URL from the JSON body and launches it in a Chrome Custom Tab for the user to complete the onboarding flow. This setup requires a backend to generate the actual Connect onboarding link.

```java
public class ConnectWithStripeActivity extends AppCompatActivity {
    private static final String BACKEND_URL = "https://example-backend-url.com/";
    private OkHttpClient httpClient = new OkHttpClient();
    private ActivityConnectWithStripeViewBinding viewBinding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        viewBinding = ActivityConnectWithStripeViewBinding.inflate(getLayoutInflater());

        viewBinding.connectWithStripe.setOnClickListener(view -> {
            WeakReference<Activity> weakActivity = new WeakReference<>(this);
            Request request = new Request.Builder()
                    .url(BACKEND_URL + "onboard-user")
                    .post(RequestBody.create("", MediaType.get("application/json; charset=utf-8")))
                    .build();
            httpClient.newCall(request)
                    .enqueue(new Callback() {
                        @Override
                        public void onFailure(@NotNull Call call, @NotNull IOException e) {
                            // Request failed
                        }

                        @Override
                        public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                            final Activity activity = weakActivity.get();
                            if (activity == null) {
                                return;
                            }
                            if (!response.isSuccessful() || response.body() == null) {
                                // Request failed
                            } else {
                                String body = response.body().string();
                                try {
                                    JSONObject responseJson = new JSONObject(body);
                                    String url = responseJson.getString("url");
                                    CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
                                    CustomTabsIntent customTabsIntent = builder.build();
                                    customTabsIntent.launchUrl(view.getContext(), Uri.parse(url));
                                } catch (JSONException e) {
                                    e.printStackTrace();
                                }
                            }
                        }
                    });
        });
    }
}
```

--------------------------------

### GET /v1/setup_intents/{SETUPINTENT_ID}

Source: https://docs.stripe.com/terminal/features/saving-payment-details/save-directly

Retrieves the details of a specific SetupIntent, expanding the `latest_attempt` to access the `generated_card` payment method if available. This is used after `processSetupIntent` to confirm the setup status and get the reusable card.

```APIDOC
## GET /v1/setup_intents/{SETUPINTENT_ID}

### Description
Retrieves the details of a specific SetupIntent, expanding the `latest_attempt` to access the `generated_card` payment method if available. This is used after `processSetupIntent` to confirm the setup status and get the reusable card.

### Method
GET

### Endpoint
/v1/setup_intents/{SETUPINTENT_ID}

### Parameters
#### Path Parameters
- **SETUPINTENT_ID** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
- **expand[]** (array of string) - Optional - Specifies which objects to expand in the response. Use `latest_attempt` to get details including `generated_card`.

### Request Example
N/A (Parameters are in path/query)

### Response
#### Success Response (200)
- **status** (string) - The status of the SetupIntent (e.g., `succeeded`).
- **latest_attempt** (object) - Expanded SetupAttempt object.
  - **payment_method_details** (object) - Details about the payment method used.
    - **card_present** (object) - Details for card-present transactions.
      - **generated_card** (string) - A reusable `card` PaymentMethod ID for online payments, if generated.

#### Response Example
```json
{
  "id": "seti_1P9P9P2eZvKYlo2CLzI3Xp5y",
  "object": "setup_intent",
  "status": "succeeded",
  "client_secret": "seti_1P9P9P2eZvKYlo2CLzI3Xp5y_secret_QWERT12345",
  "created": 1678886400,
  "customer": "cus_NOnYOnYOnYOnYOn",
  "latest_attempt": {
    "id": "su_1P9P9P2eZvKYlo2CLzI3Xp5y",
    "object": "setup_attempt",
    "payment_method_details": {
      "card_present": {
        "generated_card": "pm_1P9P9P2eZvKYlo2CLzI3Xp5y"
      }
    },
    "status": "succeeded"
  },
  "payment_method": "pm_1P9P9P2eZvKYlo2CLzI3Xp5y",
  "usage": "off_session"
}
```
```

--------------------------------

### GET /v1/setup_intents/:id

Source: https://docs.stripe.com/api/terminal/configuration/update_api-version=2025-01-27

Retrieves a specific SetupIntent, which guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## GET /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
None

#### Request Body
None

### Request Example
{}

### Response
#### Success Response (200)
None provided.

#### Response Example
{}
```

--------------------------------

### GET /v1/webhook_endpoints

Source: https://docs.stripe.com/api/terminal/configuration/update_api-version=2025-01-27

Lists all webhook endpoints configured for your Stripe account, providing an overview of your notification setup and their statuses.

```APIDOC
## GET /v1/webhook_endpoints

### Description
Lists all webhook endpoints configured for your Stripe account, providing an overview of your notification setup and their statuses.

### Method
GET

### Endpoint
/v1/webhook_endpoints
```

--------------------------------

### GET /v1/webhook_endpoints

Source: https://docs.stripe.com/api/tax/calculations/create_api-version=2025-05-28

Lists all configured webhook endpoints, allowing you to review your event notification setups.

```APIDOC
## GET /v1/webhook_endpoints

### Description
You can configure webhook endpoints via the API to be notified about events that happen in your Stripe account or connected accounts. Most users configure webhooks from the dashboard, which provides a user interface for registering and testing your webhook endpoints.

### Method
GET

### Endpoint
/v1/webhook_endpoints

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Create Stripe SetupIntent for PayPal (Server-side)

Source: https://docs.stripe.com/billing/subscriptions/paypal

These code examples demonstrate how to create a Stripe SetupIntent object on your server. This SetupIntent is configured for PayPal payments, associating it with a customer and specifying 'paypal' as the payment method type. A secret API key is required for authentication.

```python
# For SDK versions 12.4.0 or lower, remove '.v1' from the following line.
setup_intent = client.v1.setup_intents.create({
  "customer": "{{CUSTOMER_ID}}",
  "payment_method_types": ["paypal"],
  "payment_method_data": {"type": "paypal"},
})
```

```php
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
$stripe = new \Stripe\StripeClient('<<YOUR_SECRET_KEY>>');

$setupIntent = $stripe->setupIntents->create([
  'customer' => '{{CUSTOMER_ID}}',
  'payment_method_types' => ['paypal'],
  'payment_method_data' => ['type' => 'paypal'],
]);
```

```java
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeClient client = new StripeClient("<<YOUR_SECRET_KEY>>");

SetupIntentCreateParams params =
  SetupIntentCreateParams.builder()
    .setCustomer("{{CUSTOMER_ID}}")
    .addPaymentMethodType("paypal")
    .setPaymentMethodData(SetupIntentCreateParams.PaymentMethodData.builder().build())
    .putExtraParam("payment_method_data[type]", "paypal")
    .build();

// For SDK versions 29.4.0 or lower, remove '.v1()' from the following line.
SetupIntent setupIntent = client.v1().setupIntents().create(params);
```

```javascript
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('<<YOUR_SECRET_KEY>>');

const setupIntent = await stripe.setupIntents.create({
  customer: '{{CUSTOMER_ID}}',
  payment_method_types: ['paypal'],
  payment_method_data: {
    type: 'paypal',
  },
});
```

```go
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
sc := stripe.NewClient("<<YOUR_SECRET_KEY>>")
params := &stripe.SetupIntentCreateParams{
  Customer: stripe.String("{{CUSTOMER_ID}}"),
  PaymentMethodTypes: []*string{stripe.String("paypal")},
  PaymentMethodData: &stripe.SetupIntentCreatePaymentMethodDataParams{},
}
params.AddExtra("payment_method_data[type]", "paypal")
result, err := sc.V1SetupIntents.Create(context.TODO(), params)
```

```csharp
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
var options = new SetupIntentCreateOptions
{
    Customer = "{{CUSTOMER_ID}}",
    PaymentMethodTypes = new List<string> { "paypal" },
    PaymentMethodData = new SetupIntentPaymentMethodDataOptions { Type = "paypal" },
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options);
```

--------------------------------

### Stripe SetupIntent JSON Payload for US Bank Accounts (Example)

Source: https://docs.stripe.com/financial-accounts/connect/moving-money/working-with-bankaccount-objects

This concrete JSON example demonstrates a complete request body for creating a Stripe SetupIntent to attach a US bank account. It provides specific values for customer ID, bank account details, billing details, microdeposit verification, and online mandate acceptance, illustrating a typical setup for inbound and outbound funds flows.

```json
{
  "customer": "{{CUSTOMER_ID}}",
  "attach_to_self": false,
  "flow_directions": ["inbound", "outbound"],
  "payment_method_types": ["us_bank_account"],
  "payment_method_data": {
    "type": "us_bank_account",
    "us_bank_account": {
      "routing_number": "12341234",
      "account_number": "0123456789",
      "account_holder_type": "company"
    },
    "billing_details": {
      "name": "Jenny Rosen",
      "phone": "5558675309",
      "email": "jenny@example.com",
      "address": null
    }
  },
  "payment_method_options": {
    "us_bank_account": {
      "verification_method": "microdeposits"
    }
  },
  "mandate_data": {
    "customer_acceptance": {
      "type": "online",
      "online": {
        "ip_address": "123.123.123.123",
        "user_agent": "curl/1.2.3"
      }
    }
  },
  "confirm": true
}
```

--------------------------------

### Install Stripe PHP Library

Source: https://docs.stripe.com/billing/subscriptions/paypal

Instructions for installing the Stripe PHP library. The recommended method is using Composer with 'composer require stripe/stripe-php'.

```bash
# Install the PHP library with Composer
composer require stripe/stripe-php
```

```bash
# Or download the source directly: https://github.com/stripe/stripe-php/releases
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/api/setup_attempts/object_api-version=2025-03-31

Creates a new SetupIntent. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters

```

--------------------------------

### Install Stripe Ruby Library

Source: https://docs.stripe.com/billing/subscriptions/paypal

Instructions for installing the Stripe Ruby gem. You can use 'gem install' directly or add 'gem 'stripe'' to your Gemfile for Bundler projects.

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

--------------------------------

### GET /v1/crypto/onramp/quotes

Source: https://docs.stripe.com/docs/api/subscriptions

Retrieve estimated quotes for cryptocurrency onramp conversions.

```APIDOC
## GET /v1/crypto/onramp/quotes

### Description
Retrieve estimated quotes for onramp conversions into various cryptocurrencies on different networks. This API allows displaying quotes in your product UI.

### Method
GET

### Endpoint
/v1/crypto/onramp/quotes
```

--------------------------------

### GET /v1/identity/verification_reports

Source: https://docs.stripe.com/docs/api/subscriptions

List all Verification Reports associated with your Stripe account.

```APIDOC
## GET /v1/identity/verification_reports

### Description
List all Verification Reports associated with your Stripe account, showing the results of all verification attempts.

### Method
GET

### Endpoint
/v1/identity/verification_reports

### Parameters
#### Path Parameters
(No path parameters)

#### Query Parameters
(No query parameters)

#### Request Body
(No request body details provided)

### Request Example
{}

### Response
#### Success Response (200)
(No response details provided)

#### Response Example
{}
```

--------------------------------

### GET /v1/identity/verification_sessions

Source: https://docs.stripe.com/docs/api/subscriptions

List all Verification Sessions associated with your Stripe account.

```APIDOC
## GET /v1/identity/verification_sessions

### Description
List all Verification Sessions associated with your Stripe account, showing the status and details of ongoing or completed verification processes.

### Method
GET

### Endpoint
/v1/identity/verification_sessions

### Parameters
#### Path Parameters
(No path parameters)

#### Query Parameters
(No query parameters)

#### Request Body
(No request body details provided)

### Request Example
{}

### Response
#### Success Response (200)
(No response details provided)

#### Response Example
{}
```

--------------------------------

### GET /v1/tax/registrations

Source: https://docs.stripe.com/docs/api/subscriptions

List all Tax Registrations associated with your Stripe account.

```APIDOC
## GET /v1/tax/registrations

### Description
List all Tax Registrations associated with your Stripe account, showing all regions where your business is registered to collect tax.

### Method
GET

### Endpoint
/v1/tax/registrations

### Parameters
#### Path Parameters
(No path parameters)

#### Query Parameters
(No query parameters)

#### Request Body
(No request body details provided)

### Request Example
{}

### Response
#### Success Response (200)
(No response details provided)

#### Response Example
{}
```

--------------------------------

### Example JSON response for listing SetupIntents

Source: https://docs.stripe.com/api/setup_intents/list

This JSON object illustrates the typical response structure when listing SetupIntents from the Stripe API. It shows a list object containing an array of `setup_intent` objects with various properties like ID, client secret, created timestamp, and status.

```json
{
  "object": "list",
  "url": "/v1/setup_intents",
  "has_more": false,
  "data": [
    {
      "id": "seti_1Mm8s8LkdIwHu7ix0OXBfTRG",
      "object": "setup_intent",
      "application": null,
      "cancellation_reason": null,
      "client_secret": "seti_1Mm8s8LkdIwHu7ix0OXBfTRG_secret_NXDICkPqPeiBTAFqWmkbff09lRmSVXe",
      "created": 1678942624,
      "customer": null,
      "description": null,
      "flow_directions": null,
      "last_setup_error": null,
      "latest_attempt": null,
      "livemode": false,
      "mandate": null,
      "metadata": {},
      "next_action": null,
      "on_behalf_of": null,
      "payment_method": null,
      "payment_method_options": {
        "card": {
          "mandate_options": null,
          "network": null,
          "request_three_d_secure": "automatic"
        }
      },
      "payment_method_types": [
        "card"
      ],
      "single_use_mandate": null,
      "status": "requires_payment_method",
      "usage": "off_session"
    }
  ]
}
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/payment-link/update_api-version=2024-09-30

Lists all SetupIntents.

```APIDOC
## GET /v1/setup_intents

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
{}

### Response
#### Success Response (200)
None

#### Response Example
{}
```

--------------------------------

### GET /v1/entitlements/active_entitlements/:id

Source: https://docs.stripe.com/docs/api/subscriptions

Retrieve a specific active entitlement by its ID.

```APIDOC
## GET /v1/entitlements/active_entitlements/:id

### Description
Retrieves a specific active entitlement, which describes access to a feature for a customer.

### Method
GET

### Endpoint
/v1/entitlements/active_entitlements/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The unique identifier of the active entitlement.

### Request Example
{
  "Note": "No request body for GET requests"
}

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the active entitlement.
- **object** (string) - The object type, always 'active_entitlement'.
- **customer** (string) - The ID of the customer who has the entitlement.
- **feature** (string) - The ID of the feature to which the entitlement grants access.
- **expires_at** (integer) - Timestamp of when the entitlement expires.

#### Response Example
{
  "id": "ent_abc123",
  "object": "active_entitlement",
  "customer": "cus_def456",
  "feature": "feat_xyz789",
  "expires_at": 1704067200,
  "livemode": false
}
```

--------------------------------

### Install Stripe Go library with go get

Source: https://docs.stripe.com/checkout/embedded/quickstart

Initialize the Stripe Go module using `go get` to integrate Stripe payment functionality into your Go application. Ensure Go Modules are enabled for proper dependency management.

```bash
go get -u github.com/stripe/stripe-go/v83
```

--------------------------------

### GET /v1/reserve/releases/:id

Source: https://docs.stripe.com/docs/api/subscriptions

Retrieve details of a specific reserve release.

```APIDOC
## GET /v1/reserve/releases/:id

### Description
Retrieve details of a specific reserve release.

### Method
GET

### Endpoint
/v1/reserve/releases/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the reserve release.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Create Customer using Stripe CLI

Source: https://docs.stripe.com/sdks/server-side

Example of creating a new customer named 'John Doe' using the Stripe command-line interface (CLI).

```cli
stripe customers create  \
  --name="John Doe"
```

--------------------------------

### Setup Intents: Create a SetupIntent

Source: https://docs.stripe.com/api/v2/billing-meter-stream_api-version=2024-09-30

Creates a new SetupIntent object. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments without immediately collecting a payment.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent object. A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments without immediately collecting a payment.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
No path parameters for this endpoint provided in the text.

#### Query Parameters
No query parameters for this endpoint provided in the text.

#### Request Body
No specific request body parameters provided in the text.

### Request Example
```json
{
  "message": "No specific request example provided in the text."
}
```

### Response
#### Success Response (200)
No specific success response fields provided in the text.

#### Response Example
```json
{
  "message": "No specific response example provided in the text."
}
```
```

--------------------------------

### GET /v1/reserve/plans/:id

Source: https://docs.stripe.com/docs/api/subscriptions

Retrieve details of a specific reserve plan.

```APIDOC
## GET /v1/reserve/plans/:id

### Description
Retrieve details of a specific reserve plan.

### Method
GET

### Endpoint
/v1/reserve/plans/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the reserve plan.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/payments/ach-direct-debit/migrating-from-charges

Creates a Setup Intent to set up a payment method for future use. This example demonstrates setting up a US bank account as a payment method for a customer.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a Setup Intent to set up a payment method for future use. This example demonstrates setting up a US bank account as a payment method for a customer.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
N/A

#### Query Parameters
N/A

#### Request Body
- **payment_method_types** (array of strings) - Required - An array containing the IDs of payment method types that this SetupIntent is allowed to use. Example: `["us_bank_account"]`.
- **payment_method** (string) - Optional - The ID of an existing PaymentMethod to attach to this SetupIntent.
- **customer** (string) - Optional - The ID of an existing Customer to associate with this SetupIntent.

### Request Example
```json
{
  "payment_method_types": ["us_bank_account"],
  "payment_method": "{{BANK_ACCOUNT_ID}}",
  "customer": "{{CUSTOMER_ID}}"
}
```

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the SetupIntent.
- **customer** (string) - ID of the Customer associated with this SetupIntent.
- **status** (string) - Current status of the SetupIntent (e.g., "requires_payment_method", "succeeded").
- **client_secret** (string) - A client secret string for client-side confirmation.
- **usage** (string) - Indicates how the payment method will be used (e.g., "off_session").

#### Response Example
```json
{
  "id": "seti_123xyz...",
  "object": "setup_intent",
  "client_secret": "seti_123xyz..._secret_...",
  "created": 1678886400,
  "customer": "{{CUSTOMER_ID}}",
  "description": null,
  "livemode": false,
  "next_action": null,
  "payment_method": null,
  "payment_method_types": ["us_bank_account"],
  "status": "requires_payment_method",
  "usage": "off_session"
}
```
```

--------------------------------

### Display Product and Initiate Stripe Checkout (HTML/JSX)

Source: https://docs.stripe.com/checkout/quickstart

This HTML/JSX snippet demonstrates how to display a product and provide forms to initiate a Stripe Checkout session. One form posts to /create-checkout-session (for typical Stripe integration), and another example posts to /checkout.php.

```html
<div className="product">
      <img
        src="https://i.imgur.com/EHyR2nP.png"
        alt="The cover of Stubborn Attachments"
      />
      <div className="description">
      <h3>Stubborn Attachments</h3>
      <h5>$20.00</h5>
      </div>
    </div>
    <form action="/create-checkout-session" method="POST">
      <button type="submit">
        Checkout
      </button>
    </form>
    <form action="/checkout.php" method="POST">
      <button type="submit">
        Checkout
      </button>
    </form>
```

--------------------------------

### GET /v1/reserve/holds

Source: https://docs.stripe.com/docs/api/subscriptions

List all temporary reserve holds on merchant funds.

```APIDOC
## GET /v1/reserve/holds

### Description
List all temporary reserve holds on merchant funds.

### Method
GET

### Endpoint
/v1/reserve/holds

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Create Stripe SetupIntent with Customer Acceptance in C#

Source: https://docs.stripe.com/payments/nz-bank-account/migrate-from-another-processor

This C# code snippet initializes a Stripe client using a secret key and then creates a SetupIntent. It demonstrates how to specify customer acceptance details, such as the acceptance type ('offline') and the timestamp when the acceptance occurred, as part of the SetupIntent options. The created SetupIntent can then be used to collect a payment method for future use.

```csharp
CustomerAcceptance = new SetupIntentMandateDataCustomerAcceptanceOptions
{
    Type = "offline",
    AcceptedAt = DateTimeOffset.FromUnixTimeSeconds(1692821946).UtcDateTime,
},
};
var client = new StripeClient("<<YOUR_SECRET_KEY>>");
var service = client.V1.SetupIntents;
SetupIntent setupIntent = service.Create(options);
```

--------------------------------

### GET /v1/reserve/holds/:id

Source: https://docs.stripe.com/docs/api/subscriptions

Retrieve details of a specific reserve hold.

```APIDOC
## GET /v1/reserve/holds/:id

### Description
Retrieve details of a specific reserve hold.

### Method
GET

### Endpoint
/v1/reserve/holds/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the reserve hold.

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/payment_method_configurations/create_api-version=2025-03-31

Endpoints for managing SetupIntents, which guide you through setting up and saving customer payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent to guide through the process of setting up and saving a customer's payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
(None)

#### Query Parameters
(None)

#### Request Body
(Not specified in input)

### Request Example
{
  "example": "Request body not specified"
}

### Response
#### Success Response (200)
(Not specified in input)

#### Response Example
{
  "example": "Response body not specified"
}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates an existing SetupIntent with the given ID. A SetupIntent guides you through the process of setting up and saving a customer's payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters
(None)

#### Request Body
(Not specified in input)

### Request Example
{
  "example": "Request body not specified"
}

### Response
#### Success Response (200)
(Not specified in input)

#### Response Example
{
  "example": "Response body not specified"
}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves a specific SetupIntent by its ID. A SetupIntent guides you through the process of setting up and saving a customer's payment credentials.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
(None)

#### Request Body
(None)

### Request Example
{
  "example": "No request body required"
}

### Response
#### Success Response (200)
(Not specified in input)

#### Response Example
{
  "example": "Response body not specified"
}
```

```APIDOC
## GET /v1/setup_intents

### Description
Lists all SetupIntents. A SetupIntent guides you through the process of setting up and saving a customer's payment credentials.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
(None)

#### Query Parameters
(Not specified in input)

#### Request Body
(None)

### Request Example
{
  "example": "No request body required"
}

### Response
#### Success Response (200)
(Not specified in input)

#### Response Example
{
  "example": "Response body not specified"
}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a specific SetupIntent. A SetupIntent guides you through the process of setting up and saving a customer's payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters
(None)

#### Request Body
(Not specified in input)

### Request Example
{
  "example": "Request body not specified"
}

### Response
#### Success Response (200)
(Not specified in input)

#### Response Example
{
  "example": "Response body not specified"
}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent. A SetupIntent guides you through the process of setting up and saving a customer's payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters
(None)

#### Request Body
(Not specified in input)

### Request Example
{
  "example": "Request body not specified"
}

### Response
#### Success Response (200)
(Not specified in input)

#### Response Example
{
  "example": "Response body not specified"
}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies microdeposits for a SetupIntent. A SetupIntent guides you through the process of setting up and saving a customer's payment credentials.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to verify microdeposits for.

#### Query Parameters
(None)

#### Request Body
(Not specified in input)

### Request Example
{
  "example": "Request body not specified"
}

### Response
#### Success Response (200)
(Not specified in input)

#### Response Example
{
  "example": "Response body not specified"
}
```

--------------------------------

### Install Stripe SDK for Ruby

Source: https://docs.stripe.com/billing/subscriptions/ach-debit

This snippet provides instructions for installing the Stripe Ruby SDK. You can install it globally using `sudo gem install stripe` or manage it with Bundler by adding `gem 'stripe'` to your Gemfile.

```bash
sudo gem install stripe
```

```ruby
gem 'stripe'
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/api/webhook_endpoints/create_api-version=2024-10-28

Creates a new SetupIntent to guide you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Creates a new SetupIntent to guide you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
- None provided

#### Query Parameters
- None provided

#### Request Body
- Not specified in documentation.

### Request Example
{
  "example": "Request body not specified"
}

### Response
#### Success Response (200)
- Not specified in documentation.

#### Response Example
{
  "example": "Response body not specified"
}
```

--------------------------------

### GET /v1/apps/secrets

Source: https://docs.stripe.com/docs/api/subscriptions

Retrieve a list of secrets stored for the current app.

```APIDOC
## GET /v1/apps/secrets

### Description
Retrieve a list of secrets stored for the current app.

### Method
GET

### Endpoint
/v1/apps/secrets

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Create Stripe Setup Intent (cURL, CLI, Ruby)

Source: https://docs.stripe.com/payments/3d-secure/authentication-flow

This snippet demonstrates how to create a Stripe Setup Intent, which is used to set up a payment method for future payments. It associates the intent with a customer and configures 3D Secure card options. Examples are provided for cURL, Stripe CLI, and Ruby.

```curl
curl https://api.stripe.com/v1/setup_intents \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d customer="{{CUSTOMER_ID}}" \
  -d "payment_method_options[card][request_three_d_secure]"=any
```

```cli
stripe setup_intents create  \
  --customer="{{CUSTOMER_ID}}" \
  -d "payment_method_options[card][request_three_d_secure]"=any
```

```ruby
# Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
client = Stripe::StripeClient.new("<<YOUR_SECRET_KEY>>")

setup_intent = client.v1.setup_intents.create({
  customer: '{{CUSTOMER_ID}}',
  payment_method_options: {card: {request_three_d_secure: 'any'}},
})
```

--------------------------------

### GET /v1/identity/verification_sessions

Source: https://docs.stripe.com/api/tax/calculations/create_api-version=2025-05-28

Guides users through collecting and verifying identities. This endpoint retrieves a list of all VerificationSessions.

```APIDOC
## GET /v1/identity/verification_sessions

### Description
Guides users through collecting and verifying identities. This endpoint retrieves a list of all VerificationSessions.

### Method
GET

### Endpoint
/v1/identity/verification_sessions

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### Install Stripe Server-Side Libraries for Various Languages

Source: https://docs.stripe.com/payments/accept-a-payment

These code examples demonstrate how to install the official Stripe client libraries across different server-side programming languages. Each entry provides the necessary commands or dependency configurations to integrate Stripe's API into your backend application, facilitating secure payment processing.

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

```bash
# Install through pip
pip3 install --upgrade stripe
```

```python
# Specify that version in your requirements.txt file
stripe>=5.0.0
```

```bash
# Install the PHP library with Composer
composer require stripe/stripe-php
```

```java
/*
  For Gradle, add the following dependency to your build.gradle and replace with
  the version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
*/
implementation "com.stripe:stripe-java:30.0.0"
```

```xml
<!--
  For Maven, add the following dependency to your POM and replace with the
  version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
-->
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>30.0.0</version>
</dependency>
```

```bash
# Install with npm
npm install stripe --save
```

```bash
# Make sure your project is using Go Modules
go mod init
# Install stripe-go
go get -u github.com/stripe/stripe-go/v83
```

```go
// Then import the package
import (
  "github.com/stripe/stripe-go/v83"
)
```

```bash
# Install with dotnet
dotnet add package Stripe.net
dotnet restore
```

```bash
# Or install with NuGet
Install-Package Stripe.net
```

--------------------------------

### POST /v1/setup_intents

Source: https://docs.stripe.com/financial-connections/ownership-match

Creates a Setup Intent to collect payment method details from a customer. This example demonstrates setting up a Setup Intent for US bank accounts using financial connections, specifying required permissions and prefetch options.

```APIDOC
## POST /v1/setup_intents

### Description
This endpoint creates a Setup Intent, which is used to set up a customer's payment method for future payments without immediately charging them. The example focuses on configuring a Setup Intent for US bank accounts via financial connections.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
_None_

#### Query Parameters
_None_

#### Request Body
- **customer** (string) - Required - The ID of the customer for whom to set up the payment method.
- **payment_method_types[]** (array of strings) - Required - The payment method type(s) that this Setup Intent can attach. Example: `us_bank_account`.
- **payment_method_options[us_bank_account][financial_connections][permissions][]** (array of strings) - Required - The list of permissions to request during the Financial Connections session. Example: `ownership`, `payment_method`.
- **payment_method_options[us_bank_account][financial_connections][prefetch][]** (array of strings) - Optional - The list of data to prefetch from the Financial Connections session. Example: `ownership`.

### Request Example
```json
{
  "customer": "cus_NffrFeUfNV2Hib",
  "payment_method_types": [
    "us_bank_account"
  ],
  "payment_method_options": {
    "us_bank_account": {
      "financial_connections": {
        "permissions": [
          "ownership",
          "payment_method"
        ],
        "prefetch": [
          "ownership"
        ]
      }
    }
  }
}
```

### Response
#### Success Response (200)
A Setup Intent object is returned upon successful creation.
- **id** (string) - Unique identifier for the Setup Intent.
- **object** (string) - String representing the object's type. Value is `setup_intent`.
- **status** (string) - The status of the Setup Intent, one of `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `canceled`, or `succeeded`.
- **client_secret** (string) - The client secret of this Setup Intent. Used for client-side confirmation.
- **customer** (string) - The ID of the customer this Setup Intent belongs to.
- **payment_method_types** (array of strings) - The payment method type(s) this Setup Intent is for.

#### Response Example
```json
{
  "id": "seti_123abcDEFgHIjK_intent",
  "object": "setup_intent",
  "api_version": "2020-08-27",
  "created": 1678886400,
  "livemode": false,
  "status": "requires_payment_method",
  "client_secret": "seti_123abcDEFgHIjK_secret_LMNopqrSTUvwxYz",
  "customer": "cus_NffrFeUfNV2Hib",
  "payment_method": null,
  "usage": "off_session",
  "payment_method_options": {
    "us_bank_account": {
      "financial_connections": {
        "permissions": [
          "ownership",
          "payment_method"
        ]
      }
    }
  },
  "payment_method_types": [
    "us_bank_account"
  ]
}
```
```

--------------------------------

### Create and Confirm Stripe SetupIntent with Go

Source: https://docs.stripe.com/payments/mobile/finalize-payments-on-the-server

This Go server-side handler creates and confirms a Stripe SetupIntent to collect payment method details for future use. It expects a JSON request with `confirmation_token_id` and `should_save_payment_method`, uses the `stripe-go` library to interact with Stripe, and returns the SetupIntent's `client_secret` or an error response. Ensure your Stripe API key is set and the `stripe-go` library is imported.

```go
package main

import (
  "encoding/json"
  "net/http"

  "github.com/stripe/stripe-go/v76.0.0"
  "github.com/stripe/stripe-go/v76.0.0/setupintent"
)

type CheckoutData struct {
  ClientSecret string `json:"client_secret"`
}

func main() {
  stripe.Key = "<<YOUR_SECRET_KEY>>"

  http.HandleFunc("/create-intent", func(w http.ResponseWriter, r *http.Request) {
    var req struct {
      ConfirmationTokenID string `json:"confirmation_token_id"`
      ShouldSavePaymentMethod bool `json:"should_save_payment_method"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      log.Printf("json.NewDecoder.Decode: %v", err)
      return
    }
    params := &stripe.SetupIntentParams{
      Customer: stripe.String(c.ID), // The Customer ID you previously created
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      AutomaticPaymentMethods: &stripe.SetupIntentAutomaticPaymentMethodsParams{
        Enabled: stripe.Bool(true),
      },
      Confirm: stripe.Bool(true),
      ConfirmationToken: stripe.String(req.ConfirmationTokenID), // the ConfirmationToken ID sent by your client
    }
    intent, err := setupintent.New(params);
    if err == nil {
      w.Header().Set("Content-Type", "application/json")
      w.WriteHeader(http.StatusOK)
      data := CheckoutData{
        ClientSecret: intent.ClientSecret,
      }
      json.NewEncoder(w).Encode(data)
    } else {
      if stripeErr, ok := err.(*stripe.Error); ok {
        switch stripeErr.Type {
          case stripe.ErrorTypeCard:
            http.Error(w, stripeErr.Msg, http.StatusInternalServerError)
          default:
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
      } else {
        http.Error(w, err.Error(), http.StatusInternalServerError)
      }
    }
  })

  http.ListenAndServe(":4242", nil)
}
```

--------------------------------

### GET /v1/identity/verification_sessions

Source: https://docs.stripe.com/api/payment_intents/create_api-version=2025-01-27

Lists all VerificationSessions. A VerificationSession guides you through collecting and verifying user identities.

```APIDOC
## GET /v1/identity/verification_sessions

### Description
Lists all VerificationSessions. A VerificationSession guides you through collecting and verifying user identities.

### Method
GET

### Endpoint
/v1/identity/verification_sessions

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)

#### Response Example
{}
```

--------------------------------

### GET /v1/terminal/locations

Source: https://docs.stripe.com/api/payment-link/create_api-version=2024-10-28

A Location represents a grouping of readers.
Related guide: Fleet management

```APIDOC
## GET /v1/terminal/locations

### Description
A Location represents a grouping of readers.
Related guide: Fleet management

### Method
GET

### Endpoint
/v1/terminal/locations
```

--------------------------------

### Initiate Stripe Connect Onboarding in Objective-C

Source: https://docs.stripe.com/connect/end-to-end-marketplace

This Objective-C code demonstrates how to programmatically create a button, attach an action, and initiate the Stripe Connect onboarding flow. It makes a POST request to a backend endpoint to retrieve an onboarding URL, then presents it using `SFSafariViewController`. Basic error handling for network requests and JSON parsing is included.

```objc
#import "ConnectOnboardViewController.h"

#import <SafariServices/SafariServices.h>

static NSString * const kBackendAPIBaseURL = @"";  // Set to the URL of your backend server

@interface ConnectOnboardViewController () <SFSafariViewControllerDelegate>
// ...
@end

@implementation ConnectOnboardViewController

// ...

- (void)viewDidLoad {
    [super viewDidLoad];

    UIButton *connectWithStripeButton = [UIButton buttonWithType:UIButtonTypeSystem];
    [connectWithStripeButton setTitle:@"Connect with Stripe" forState:UIControlStateNormal];
    [connectWithStripeButton addTarget:self action:@selector(_didSelectConnectWithStripe) forControlEvents:UIControlEventTouchUpInside];
    [self.view addSubview:connectWithStripeButton];

    // ...
}

- (void)_didSelectConnectWithStripe {
  NSURL *url = [NSURL URLWithString:[kBackendAPIBaseURL stringByAppendingPathComponent:@"onboard-user"]];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  request.HTTPMethod = @"POST";

  NSURLSessionTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
      if (data != nil) {
          NSError *jsonError = nil;
          id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];

          if (json != nil && [json isKindOfClass:[NSDictionary class]]) {
              NSDictionary *jsonDictionary = (NSDictionary *)json;
              NSURL *accountURL = [NSURL URLWithString:jsonDictionary[@"url"]];
              if (accountURL != nil) {
                  SFSafariViewController *safariViewController = [[SFSafariViewController alloc] initWithURL:accountURL];
                  safariViewController.delegate = self;

                  dispatch_async(dispatch_get_main_queue(), ^{
                      [self presentViewController:safariViewController animated:YES completion:nil];
                  });
              } else {
                  // handle  error
              }
          } else {
              // handle error
          }
      } else {
          // handle error
      }
  }];
  [task resume];
}

// ...

#pragma mark - SFSafariViewControllerDelegate
- (void)safariViewControllerDidFinish:(SFSafariViewController *)controller {
    // The user may have closed the SFSafariViewController instance before a redirect
    // occurred. Sync with your backend to confirm the correct state
}

@end
```

--------------------------------

### Set up Go server to create Stripe Account Sessions

Source: https://docs.stripe.com/connect/get-started-connect-embedded-components

This Go code defines an HTTP server that serves static files and provides an endpoint (`/account_session`) to create Stripe Account Sessions. It leverages the `stripe-go` library to interact with the Stripe API, configuring account onboarding components and disabling user authentication for a smoother experience. The server handles POST requests, processes Stripe API responses, and returns the client secret or an error in JSON format.

```go
package main

import (
  "bytes"
  "encoding/json"
  "io"
  "log"
  "net/http"
	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/accountsession"
)

func main() {
    // This is a placeholder - it should be replaced with your secret API key.
    // Sign in to see your own test API key embedded in code samples.
    // Don’t submit any personally identifiable information in requests made with this key.
    stripe.Key = '<<YOUR_SECRET_KEY>>'

    http.Handle("/", http.FileServer(http.Dir("public")))
    http.HandleFunc("/account_session", CreateAccountSession)
    addr := "localhost:4242"
    log.Printf("Listening on %s", addr)
    log.Fatal(http.ListenAndServe(addr, nil))
}

func CreateAccountSession(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
      http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
      return
    }

    accountSession, err := accountsession.New(
      &stripe.AccountSessionParams{
        Account: stripe.String("{{CONNECTED_ACCOUNT_ID}}"),
        Components: &stripe.AccountSessionComponentsParams{
          AccountOnboarding: &stripe.AccountSessionComponentsAccountOnboardingParams{
            Enabled: stripe.Bool(true),
            Features: &stripe.AccountSessionComponentsAccountOnboardingFeaturesParams{
              // We recommend disabling authentication for a better user experience when possible
              DisableStripeUserAuthentication: stripe.Bool(true),
            },
        },
      },
    })

    if err != nil {
      log.Printf("An error occurred when calling the Stripe API to create an account session: %v", err)
      w.WriteHeader(http.StatusInternalServerError)
      if stripeErr, ok := err.(*stripe.Error); ok {
        writeJSON(w, struct {
          Error string `json:"error"`
        }{
          Error: stripeErr.Msg,
        })
      } else {
        writeJSON(w, struct {
          Error string `json:"error"`
        }{
          Error: err.Error(),
        })
      }
      return
    }

    writeJSON(w, struct {
      ClientSecret string `json:"client_secret"`
    }{
      ClientSecret: accountSession.ClientSecret,
    })
}

func writeJSON(w http.ResponseWriter, v interface{}) {
  var buf bytes.Buffer
  if err := json.NewEncoder(&buf).Encode(v); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    log.Printf("json.NewEncoder.Encode: %v", err)
    return
  }
  w.Header().Set("Content-Type", "application/json")
  if _, err := io.Copy(w, &buf); err != nil {
    log.Printf("io.Copy: %v", err)
    return
  }
}
```

--------------------------------

### Install Stripe Python Library

Source: https://docs.stripe.com/billing/subscriptions/paypal

Instructions for installing the Stripe Python library. Use 'pip3 install' to upgrade the library or specify the desired version in your 'requirements.txt' file.

```bash
# Install through pip
pip3 install --upgrade stripe
```

```bash
# Or find the Stripe package on http://pypi.python.org/pypi/stripe/
```

```python
# Find the version you want to pin:
# https://github.com/stripe/stripe-python/blob/master/CHANGELOG.md
# Specify that version in your requirements.txt file
stripe>=5.0.0
```

--------------------------------

### GET /v1/setup_intents

Source: https://docs.stripe.com/api/setup_intents/create_api-version=2024-10-28

Returns a paginated list of SetupIntents, optionally filtered by customer or payment method.

```APIDOC
## GET /v1/setup_intents

### Description
Returns a paginated list of SetupIntents, optionally filtered by customer or payment method.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Query Parameters
- **customer** (string) - Optional - Only return SetupIntents for the customer specified by this customer ID.
- **payment_method** (string) - Optional - Only return SetupIntents that associate with the specified payment method.
- **attach_to_self** (boolean) - Optional
- **created** (Map) - Optional
- **ending_before** (string) - Optional - A cursor for use in pagination.
- **limit** (integer) - Optional - A limit on the number of objects to be returned.
- **starting_after** (string) - Optional - A cursor for use in pagination.

### Request Example
N/A

### Response
#### Success Response (200)
- **object** (string) - String representing the object's type. Value is "list".
- **url** (string) - The URL where this list can be accessed.
- **has_more** (boolean) - True if this list contains additional objects that are not included in this response.
- **data** (array) - A list of SetupIntent objects.

#### Response Example
{
  "object": "list",
  "url": "/v1/setup_intents",
  "has_more": false,
  "data": [
    {
      "id": "seti_1Mm8s8LkdIwHu7ix0OXBfTRG",
      "object": "setup_intent",
      "application": null,
      "cancellation_reason": null,
      "client_secret": "seti_1Mm8s8LkdIwHu7ix0OXBfTRG_secret_NXDICkPqPeiBTAFqWmkbff09lRmSVXe",
      "created": 1678942624,
      "customer": null,
      "description": null,
      "flow_directions": null,
      "last_setup_error": null,
      "latest_attempt": null,
      "livemode": false,
      "mandate": null,
      "metadata": {},
      "next_action": null,
      "on_behalf_of": null,
      "payment_method": null,
      "payment_method_options": {
        "card": {
          "mandate_options": null,
          "network": null,
          "request_three_d_secure": "automatic"
        }
      },
      "payment_method_types": [
        "card"
      ],
      "single_use_mandate": null,
      "status": "requires_payment_method",
      "usage": "off_session"
    }
  ]
}
```

--------------------------------

### Build and Run Go Server and Node.js Client for Stripe Integration

Source: https://docs.stripe.com/connect/connect-embedded-components/quickstart

Provides commands for setting up and running both a Go backend server and a Node.js frontend client. It covers Go module download, running the Go server, and `npm` commands for installing and starting the client application.

```shell
go mod download github.com/stripe/stripe-go/v82
```

```shell
go run server.go
```

```shell
npm install
```

```shell
npm start
```

--------------------------------

### GET /v1/setup_intents/:id

Source: https://docs.stripe.com/api/prices/object_api-version=2025-02-24

Retrieves a specific SetupIntent, which guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## GET /v1/setup_intents/:id

### Description
A SetupIntent guides you through the process of setting up and saving a customer’s payment credentials for future payments. For example, you can use a SetupIntent to set up and save your customer’s card without immediately collecting a payment. Later, you can use PaymentIntents to drive the payment flow. Create a SetupIntent when you’re ready to collect your customer’s payment credentials. Don’t maintain long-lived, unconfirmed SetupIntents because they might not be valid. The SetupIntent transitions through multiple statuses as it guides you through the setup process. Successful SetupIntents result in payment credentials that are optimized for future payments. For example, cardholders in certain regions might need to be run through Strong Customer Authentication during payment method collection to streamline later off-session payments. If you use the SetupIntent with a Customer, it automatically attaches the resulting payment method to that Customer after successful setup. We recommend using SetupIntents or setup_future_usage on PaymentIntents to save payment methods to prevent saving invalid or unoptimized payment methods. By using SetupIntents, you can reduce friction for your customers, even as regulations change over time.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.
```

--------------------------------

### Server-side Confirmation of Stripe PaymentIntent with Installments

Source: https://docs.stripe.com/payments/jp-installments/accept-a-payment

These code examples demonstrate how to confirm a Stripe PaymentIntent on the backend, potentially incorporating selected installment plan details passed from the client. They handle API calls to Stripe's PaymentIntent confirmation endpoint and include error handling for card-related issues.

```bash
curl https://api.stripe.com/v1/payment_intents/{{PAYMENT_INTENT_ID}}/confirm \
  -u <<YOUR_SECRET_KEY>>: \
  -d "payment_method_options[card][installments][plan][type]"="fixed_count" \
  -d "payment_method_options[card][installments][plan][interval]"="month" \
  -d "payment_method_options[card][installments][plan][count]"=3
```

```ruby
post '/confirm_payment' do
  data = JSON.parse(request.body.read.to_s)

  confirm_data = {}
  if data.key?('selected_plan')
    confirm_data = {
      payment_method_options: {
        card: {
          installments: {
            plan: data['selected_plan'],
          },
        },
      },
    }
  end

  begin
    # Create the PaymentIntent
    intent = Stripe::PaymentIntent.confirm(
      data['payment_intent_id'],
      confirm_data
    )
  rescue Stripe::CardError => e
    # Display error on client
    return [500, {error: e.message}.to_json]
  end

  return [200, {
    success: true,
    status: intent.status,
  }.to_json]
end
```

```python
@app.route('/confirm_payment', methods=['POST'])
def confirm_payment():
    confirm_data = {}

    data = request.get_json()
    selected_plan = data.get('selected_plan')
    if selected_plan is not None:
        confirm_data = {
            'card': {
                'installments': {
                    'plan': selected_plan
                }
            }
        }

    try:
        intent = stripe.PaymentIntent.confirm(
            data['payment_intent_id'],
            payment_method_options=confirm_data
        )
    except stripe.error.CardError as e:
        return jsonify({'error': e.user_message})

    return jsonify({'success': True, 'status': intent['status']})
```

```php
<?php

# vendor using composer
require_once('vendor/autoload.php');

\Stripe\Stripe::setApiKey('<<YOUR_SECRET_KEY>>');

header('Content-Type: application/json');
```

--------------------------------

### Android Activity to Initiate Stripe Connect Onboarding (Kotlin)

Source: https://docs.stripe.com/connect/end-to-end-marketplace

This Kotlin code defines an `AppCompatActivity` responsible for handling the Stripe Connect onboarding flow. It sets up an `OnClickListener` for the 'Connect with Stripe' button, which then makes an HTTP POST request to a backend endpoint using OkHttpClient. The backend is expected to return a URL, which is then launched in a Custom Tab, directing the user to the Stripe Connect onboarding page.

```kotlin
class ConnectWithStripeActivity : AppCompatActivity() {

    private val viewBinding: ActivityConnectWithStripeViewBinding by lazy {
        ActivityConnectWithStripeViewBinding.inflate(layoutInflater)
    }
    private val httpClient = OkHttpClient()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(viewBinding.root)

        viewBinding.connect_with_stripe.setOnClickListener {
            val weakActivity = WeakReference<Activity>(this)
            val request = Request.Builder()
                .url(BACKEND_URL + "onboard-user")
                .post("".toRequestBody())
                .build()
            httpClient.newCall(request)
                .enqueue(object: Callback {
                    override fun onFailure(call: Call, e: IOException) {
                        // Request failed
                    }
                    override fun onResponse(call: Call, response: Response) {
                        if (!response.isSuccessful) {
                            // Request failed
                        } else {
                            val responseData = response.body?.string()
                            val responseJson =
                                responseData?.let { JSONObject(it) } ?: JSONObject()
                            val url = responseJson.getString("url")

                            weakActivity.get()?.let {
                                val builder: CustomTabsIntent.Builder = CustomTabsIntent.Builder()
                                val customTabsIntent = builder.build()
                                customTabsIntent.launchUrl(it, Uri.parse(url))
                            }
                        }
                    }
                })
        }
    }

    internal companion object {
        internal const val BACKEND_URL = "https://example-backend-url.com/"
    }
}
```

--------------------------------

### Create Stripe Setup Intent (Go, .NET)

Source: https://docs.stripe.com/payments/finalize-payments-on-the-server-legacy

This snippet demonstrates how to implement a server-side endpoint to create a Stripe SetupIntent. It configures the SetupIntent with a customer ID, a payment method ID from the client, a return URL, and mandate data for compliance, handling potential Stripe API errors. It requires the Stripe SDK for the respective language and a valid Stripe API secret key.

```go
package main

import (
  "encoding/json"
  "net/http"

  "github.com/stripe/stripe-go/v76.0.0"
  "github.com/stripe/stripe-go/v76.0.0/setupintent"
)

type CheckoutData struct {
  ClientSecret string `json:"client_secret"`
}

func main() {
  stripe.Key = "<<YOUR_SECRET_KEY>>"

  http.HandleFunc("/create-intent", func(w http.ResponseWriter, r *http.Request) {
    var req struct {
      PaymentMethodID string `json:"payment_method_id"`
      ShouldSavePaymentMethod bool `json:"should_save_payment_method"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
      http.Error(w, err.Error(), http.StatusInternalServerError)
      log.Printf("json.NewDecoder.Decode: %v", err)
      return
    }
    params := &stripe.SetupIntentParams{
      Customer: stripe.String(c.ID), // The Customer ID you previously created
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      AutomaticPaymentMethods: &stripe.SetupIntentAutomaticPaymentMethodsParams{
        Enabled: stripe.Bool(true),
      },
      Confirm: stripe.Bool(true),
      PaymentMethod: stripe.String(req.PaymentMethodID), // the PaymentMethod ID sent by your client
      ReturnURL: stripe.String(string("stripesdk://payment_return_url/com.company.myapp")), // Set this to "stripesdk://payment_return_url/" + your application ID
      MandateData: &stripe.SetupIntentMandateDataParams{
        CustomerAcceptance: &stripe.SetupIntentMandateDataCustomerAcceptanceParams{
          Type: stripe.String("online"),
          Online: &stripe.SetupIntentMandateDataCustomerAcceptanceOnlineParams{
            IPAddress: stripe.String(/* your client's IP address */),
            UserAgent: stripe.String(r.UserAgent()),
          },
        },
      },
    }
    intent, err := setupintent.New(params);
    if err == nil {
      w.Header().Set("Content-Type", "application/json")
      w.WriteHeader(http.StatusOK)
      data := CheckoutData{
        ClientSecret: intent.ClientSecret,
      }
      json.NewEncoder(w).Encode(data)
    } else {
      if stripeErr, ok := err.(*stripe.Error); ok {
        switch stripeErr.Type {
          case stripe.ErrorTypeCard:
            http.Error(w, stripeErr.Msg, http.StatusInternalServerError)
          default:
            http.Error(w, err.Error(), http.StatusInternalServerError)
        }
      } else {
        http.Error(w, err.Error(), http.StatusInternalServerError)
      }
    }
  })

  http.ListenAndServe(":4242", nil)
}
```

```csharp
using System;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace StripeExampleApi.Controllers
{
  [Route("create-intent")]
  [ApiController]
  public class CheckoutApiController : Controller
  {
    public CheckoutApiController()
    {
      StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>"
    }

    [HttpPost]
    public ActionResult Post(IntentCreateRequest request)
    {
      var options = new SetupIntentCreateOptions()
      {
        Customer = customer.Id, // The Customer ID you previously created
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        AutomaticPaymentMethods = new SetupIntentAutomaticPaymentMethodsOptions
        {
          Enabled = true,
        },
        Confirm = true,
        PaymentMethod = request.PaymentMethodId, // the PaymentMethod ID sent by your client
        ReturnUrl = "stripesdk://payment_return_url/com.company.myapp", // Set this to "stripesdk://payment_return_url/" + your application ID
        MandateData = new PaymentIntentMandateDataOptions
        {
          CustomerAcceptance = new PaymentIntentMandateDataCustomerAcceptanceOptions
          {
            Type = "online",
            Online = new PaymentIntentMandateDataCustomerAcceptanceOnlineOptions
            {
              IpAddress = ... /* The client's IP address*/,
              UserAgent = Request.Headers["User-Agent"].ToString()
            }
          },
        },
      };
      var service = new SetupIntentService();
      try
      {
        SetupIntent intent = service.Create(options);
        return Json(new { client_secret = intent.ClientSecret });
      }
      catch (StripeException e)
      {
        this.HttpContext.Response.StatusCode = 400;
        switch (e.StripeError.Type)
        {
          case "card_error":
            return Json(new { error = e.Message }); // For card errors, the message can be shown to your users
          default:
            return Json(new { error = e.Message }); // Other errors may not be localized
        }
      }
    }

    public class IntentCreateRequest
    {
      [JsonProperty("payment_method_id")]
      public string PaymentMethodId { get; set; }
      [JsonProperty("should_save_payment_method")]
      public bool ShouldSavePaymentMethod { get; set; }
    }
  }
}
```

--------------------------------

### Setup Intents API

Source: https://docs.stripe.com/api/payouts/create_api-version=2025-08-27

Guides you through the process of setting up and saving a customer’s payment credentials for future payments.

```APIDOC
## POST /v1/setup_intents

### Description
Create a SetupIntent when you’re ready to collect your customer’s payment credentials. Don’t maintain long-lived, unconfirmed SetupIntents because they might not be valid.

### Method
POST

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
[No information provided]

#### Query Parameters
[No information provided]

#### Request Body
[No information provided]

### Request Example
{}

### Response
#### Success Response (200)
A SetupIntent object.

#### Response Example
{
  "id": "seti_123example",
  "object": "setup_intent",
  "status": "requires_payment_method"
}
```

```APIDOC
## POST /v1/setup_intents/:id

### Description
Updates the specified SetupIntent by setting the values of the parameters passed. Any parameters not provided will be left unchanged.

### Method
POST

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to update.

#### Query Parameters
[No information provided]

#### Request Body
[No information provided]

### Request Example
{}

### Response
#### Success Response (200)
The updated SetupIntent object.

#### Response Example
{
  "id": "seti_123example",
  "object": "setup_intent",
  "status": "requires_action"
}
```

```APIDOC
## GET /v1/setup_intents/:id

### Description
Retrieves the details of a SetupIntent that has previously been created. Supply the unique SetupIntent ID that was returned from your previous request, and Stripe will return the corresponding SetupIntent information.

### Method
GET

### Endpoint
/v1/setup_intents/:id

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to retrieve.

#### Query Parameters
[No information provided]

#### Request Body
[No information provided]

### Request Example
{}

### Response
#### Success Response (200)
The SetupIntent object.

#### Response Example
{
  "id": "seti_123example",
  "object": "setup_intent",
  "status": "succeeded"
}
```

```APIDOC
## GET /v1/setup_intents

### Description
Returns a list of SetupIntents. The SetupIntents are returned in reverse chronological order by creation date.

### Method
GET

### Endpoint
/v1/setup_intents

### Parameters
#### Path Parameters
[No information provided]

#### Query Parameters
[No information provided]

#### Request Body
[No information provided]

### Request Example
{}

### Response
#### Success Response (200)
A list of SetupIntent objects.

#### Response Example
{
  "object": "list",
  "data": [
    {
      "id": "seti_123example",
      "object": "setup_intent",
      "status": "succeeded"
    }
  ],
  "has_more": false,
  "url": "/v1/setup_intents"
}
```

```APIDOC
## POST /v1/setup_intents/:id/cancel

### Description
Cancels a SetupIntent and all its associated PaymentIntents, if any. The SetupIntent cannot be canceled if it has already succeeded or failed.

### Method
POST

### Endpoint
/v1/setup_intents/:id/cancel

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to cancel.

#### Query Parameters
[No information provided]

#### Request Body
[No information provided]

### Request Example
{}

### Response
#### Success Response (200)
The canceled SetupIntent object.

#### Response Example
{
  "id": "seti_123example",
  "object": "setup_intent",
  "status": "canceled"
}
```

```APIDOC
## POST /v1/setup_intents/:id/confirm

### Description
Confirms a SetupIntent. This confirms the SetupIntent with the specified payment method and automatically attempts to perform any required actions, such as Strong Customer Authentication.

### Method
POST

### Endpoint
/v1/setup_intents/:id/confirm

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to confirm.

#### Query Parameters
[No information provided]

#### Request Body
[No information provided]

### Request Example
{}

### Response
#### Success Response (200)
The confirmed SetupIntent object.

#### Response Example
{
  "id": "seti_123example",
  "object": "setup_intent",
  "status": "succeeded"
}
```

```APIDOC
## POST /v1/setup_intents/:id/verify_microdeposits

### Description
Verifies the microdeposit amounts for a SetupIntent. Microdeposits must be confirmed to ensure the bank account verification is complete.

### Method
POST

### Endpoint
/v1/setup_intents/:id/verify_microdeposits

### Parameters
#### Path Parameters
- **id** (string) - Required - The ID of the SetupIntent to verify microdeposits for.

#### Query Parameters
[No information provided]

#### Request Body
[No information provided]

### Request Example
{}

### Response
#### Success Response (200)
The SetupIntent object with verified microdeposits.

#### Response Example
{
  "id": "seti_123example",
  "object": "setup_intent",
  "status": "succeeded"
}
```

--------------------------------

### Create Stripe Customer and Subscription across multiple languages

Source: https://docs.stripe.com/payments/checkout/migration

This collection of code examples demonstrates how to create a Stripe customer and subsequently a subscription for that customer. It covers various programming languages, showing how to provide customer details like email and payment source, then link the subscription to the customer with a specified price ID and quantity. The Java example specifically focuses on SubscriptionCreateParams.

```ruby
customer = Stripe::Customer.create(
  email: data['stripeEmail'],
  source: data['stripeToken'],
)

subscription = Stripe::Subscription.create(
  customer: customer.id,
  items: [{
    price: {{PRICE_ID}},
    quantity: 1,
  }],
)
```

```python
customer = stripe.Customer.create(
  email=data['stripeEmail'],
  source=data['stripeToken'],
)

subscription = stripe.Subscription.create(
  customer=customer.id,
  items=[{
    price: {{PRICE_ID}},
    'quantity': 1,
  }],
)
```

```php
$customer = \Stripe\Customer::create([
  'email' => $_POST['stripeEmail'],
  'source' => $_POST['stripeToken'],
]);

$subscription = \Stripe\Subscription::create([
  'customer' => $customer->id,
  'items' => [[
    'price' => {{PRICE_ID}},
    'quantity' => 1,
  ]],
]);
```

```java
SubscriptionCreateParams params =
  SubscriptionCreateParams.builder()
    .addItem(
      SubscriptionCreateParams.Item.builder()
        .setPrice("{{PRICE_ID}}")
        .setQuantity(1L)
        .build())
```

```javascript
const customer = await stripe.customers.create({
  email: request.body.stripeEmail,
  source: request.body.stripeToken,
});

const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{
    price: {{PRICE_ID}},
    quantity: 1,
  }],
});
```

```go
customerParams := &stripe.CustomerParams{
    Email: stripe.String(*request.stripeEmail),
}
customerParams.SetSource(*request.stripeToken)
customer, _ := customer.New(customerParams)

subscriptionParams := &stripe.SubscriptionParams{
    Customer: stripe.String(customer.Id),
    Items: []*stripe.SubscriptionItemsParams{
        &stripe.SubscriptionItemsParams{
            Price: stripe.String("{{PRICE_ID}}"),
            Quantity: stripe.Int64(1),
        },
    },
}
subscription, _ := subscription.New(subscriptionParams)
```

```dotnet
var customerOptions = new CustomerCreateOptions
{
    Email = request.stripeEmail,
    Source = request.stripeToken,
};
var customerService = new CustomerService();
Customer customer = customerService.Create(customerOptions);

var subscriptionOptions = new SubscriptionCreateOptions
{
    Customer = customer.id,
    Items = new List<SubscriptionItemOptions>
    {
        new SubscriptionItemOptions
        {
            Price = "{{PRICE_ID}}",
            Quantity = 1,
        },
    },
};
var subscriptionService = new SubscriptionService();
Subscription subscription = subscriptionService.Create(subscriptionOptions);
```

--------------------------------

### POST /v1/account_sessions - Set up App Installation

Source: https://docs.stripe.com/stripe-apps/embedded-apps

Creates an Account Session to enable app installation and app viewport rendering for specified Stripe Apps. This process grants permission for the third-party app to access user's Stripe data, establishing a connection between your platform, Stripe, and the app.

```APIDOC
## POST /v1/account_sessions

### Description
Creates an Account Session to enable app installation and app viewport rendering for specified Stripe Apps. This process grants permission for the third-party app to access user's Stripe data, establishing a connection between your platform, Stripe, and the app.

### Method
POST

### Endpoint
/v1/account_sessions

### Parameters
#### Path Parameters
_None_

#### Query Parameters
_None_

#### Request Body
- **account** (string) - Required - The ID of the connected account for which to create the session.
- **components[app_install][enabled]** (boolean) - Required - Set to `true` to enable app installation.
- **components[app_install][features][allowed_apps][]** (array of strings) - Required - A list of App IDs that are allowed for installation. E.g., `["com.example.acodeistripeapp"]`.
- **components[app_viewport][enabled]** (boolean) - Required - Set to `true` to enable the app viewport.
- **components[app_viewport][features][allowed_apps][]** (array of strings) - Required - A list of App IDs that are allowed to be displayed in the viewport. E.g., `["com.example.acodeistripeapp"]`.

### Request Example
```json
{
  "account": "acct_12345",
  "components": {
    "app_install": {
      "enabled": true,
      "features": {
        "allowed_apps": [
          "APP_ID"
        ]
      }
    },
    "app_viewport": {
      "enabled": true,
      "features": {
        "allowed_apps": [
          "APP_ID"
        ]
      }
    }
  }
}
```

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the account session.
- **object** (string) - Value is `account_session`.
- **client_secret** (string) - A client secret that can be used to authenticate access to the account session.
- **account** (string) - The ID of the connected account this session belongs to.
- **components** (object) - Configuration for enabled embedded components.
  - **app_install** (object) - Configuration for the app installation component.
    - **enabled** (boolean) - Indicates if app installation is enabled.
    - **features** (object) - Features enabled for app installation.
      - **allowed_apps** (array of strings) - Apps allowed for installation.
  - **app_viewport** (object) - Configuration for the app viewport component.
    - **enabled** (boolean) - Indicates if app viewport is enabled.
    - **features** (object) - Features enabled for app viewport.
      - **allowed_apps** (array of strings) - Apps allowed in the viewport.

#### Response Example
```json
{
  "id": "accts_123abcDEFgHIJklMNOpQR",
  "object": "account_session",
  "client_secret": "accts_123abcDEFgHIJklMNOpQR_secret_ABCDEfGHijKLMnOPqRSTuV",
  "account": "acct_12345",
  "components": {
    "app_install": {
      "enabled": true,
      "features": {
        "allowed_apps": [
          "com.example.acodeistripeapp"
        ]
      }
    },
    "app_viewport": {
      "enabled": true,
      "features": {
        "allowed_apps": [
          "com.example.acodeistripeapp"
        ]
      }
    }
  }
}
```
```

--------------------------------

### Set up Stripe Payment Sheet Backend

Source: https://docs.stripe.com/connect/end-to-end-saas-platform

This collection of code examples demonstrates how to set up the backend logic for a Stripe Payment Sheet. It covers creating a customer, establishing a customer session with mobile payment element features enabled, and creating a payment intent, providing the necessary client secrets and publishable key for the frontend integration. Examples are provided for .NET, cURL, and Ruby, including support for connected accounts.

```dotnet
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
StripeConfiguration.ApiKey = "<<YOUR_SECRET_KEY>>";

[HttpPost("payment-sheet")]
public ActionResult<PaymentSheetCreateResponse> CreatePaymentSheet([FromBody] CreatePaymentSheetRequest req)
{
  // Use an existing Customer ID if this is a returning customer.
  var customerOptions = new CustomerCreateOptions();
  var customerService = new CustomerService();
  var requestOptions =
{
    StripeAccount = "{{CONNECTED_ACCOUNT_ID}}"
};
  var customer = customerService.Create(customerOptions, requestOptions);
    var customerSessionOptions = new CustomerSessionCreateOptions
    {
      Customer = customer.Id,
      Components = new CustomerSessionComponentsOptions()
    };
    customerSessionOptions.AddExtraParam("components[mobile_payment_element][enabled]", true);
    customerSessionOptions.AddExtraParam(
        "components[mobile_payment_element][features][payment_method_save]",
        "enabled");
    customerSessionOptions.AddExtraParam(
        "components[mobile_payment_element][features][payment_method_redisplay]",
        "enabled");
    customerSessionOptions.AddExtraParam(
        "components[mobile_payment_element][features][payment_method_remove]",
        "enabled");

   var service = new CustomerSessionService();
   var customerSession = service.Create(options);

  var paymentIntentOptions = new PaymentIntentCreateOptions
  {
    Amount = 1099,
    Currency = "eur",
    Customer = customer.Id,
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter
    // is optional because Stripe enables its functionality by default.
    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
    {
      Enabled = true,
    },
    ApplicationFeeAmount = 123,
  };
  var requestOptions = new RequestOptions
  {
    StripeAccount = ""{{CONNECTED_ACCOUNT_ID}}"",
  };
  var paymentIntentService = new PaymentIntentService();
  PaymentIntent paymentIntent = paymentIntentService.Create(paymentIntentOptions, requestOptions);

  return new PaymentSheetCreateResponse
  {
    PaymentIntent = paymentIntent.ClientSecret,
    CustomerSessionClientSecret = customerSession.ClientSecret

    Customer = customer.Id,
    PublishableKey = "<<YOUR_PUBLISHABLE_KEY>>",
  };
}
```

```bash
# Create a Customer (use an existing Customer ID if this is a returning customer)
curl https://api.stripe.com/v1/customers \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -H "Stripe-Account: {{CONNECTED_ACCOUNT_ID}}"

# Create an CustomerSession for the Customer
curl https://api.stripe.com/v1/customer_sessions \
  -u <<YOUR_SECRET_KEY>>: \
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "components[mobile_payment_element][enabled]"=true \
  -d "components[mobile_payment_element][features][payment_method_save]"=enabled \
  -d "components[mobile_payment_element][features][payment_method_redisplay]"=enabled \
  -d "components[mobile_payment_element][features][payment_method_remove]"=enabled

# Create a PaymentIntent
curl https://api.stripe.com/v1/payment_intents \
  -u <<YOUR_SECRET_KEY>>: \
  -H "Stripe-Account: {{CONNECTED_ACCOUNT_ID}}"
  -X "POST" \
  -d "customer"="{{CUSTOMER_ID}}" \
  -d "amount"=1099 \
  -d "currency"="eur" \
  -d "payment_method_types[]"="bancontact" \
  -d "payment_method_types[]"="card" \
  -d "payment_method_types[]"="ideal" \
  -d "payment_method_types[]"="klarna" \
  -d "payment_method_types[]"="sepa_debit" \
  -d application_fee_amount="123" \
```

```ruby
# This example sets up an endpoint using the Sinatra framework.



post '/payment-sheet' do
  # Use an existing Customer ID if this is a returning customer
  customer = Stripe::Customer.create({stripe_account: '{{CONNECTED_ACCOUNT_ID}}'})
  customerSession = Stripe::CustomerSession.create({
    customer: customer['id'],
    components: {
      mobile_payment_element: {
        enabled: true,
        features: {
          payment_method_save: 'enabled',
          payment_method_redisplay: 'enabled',
          payment_method_remove: 'enabled',
        },
      },
    },
  })
  paymentIntent = Stripe::PaymentIntent.create({
    amount: 1099,
    currency: 'eur',
    customer: customer['id'],
    payment_method_types: ['bancontact', 'card', 'ideal', 'klarna', 'sepa_debit'],
    application_fee_amount: 123,
  }, {stripe_account: '{{CONNECTED_ACCOUNT_ID}}'})
  {
    paymentIntent: paymentIntent['client_secret'],
    customerSessionClientSecret: customerSession['client_secret'],
    customer: customer['id'],
    publishableKey: '<<YOUR_PUBLISHABLE_KEY>>'
  }.to_json
end
```

--------------------------------

### Install Stripe Java Client Library

Source: https://docs.stripe.com/billing/subscriptions/build-subscriptions_platform=web&ui=elements

This snippet demonstrates how to include the Stripe Java client library in your project. It provides dependency configurations for Gradle and Maven, as well as instructions for manual JAR installation for other environments.

```Gradle
/*
  For Gradle, add the following dependency to your build.gradle and replace with
  the version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
*/
implementation "com.stripe:stripe-java:30.0.0"
```

```Maven XML
<!--
  For Maven, add the following dependency to your POM and replace with the
  version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
-->
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>30.0.0</version>
</dependency>
```

```Plain Text
# For other environments, manually install the following JARs:
# - The Stripe JAR from https://github.com/stripe/stripe-java/releases/latest
# - Google Gson from https://github.com/google/gson
```

--------------------------------

### Install Stripe Client Library Dependencies

Source: https://docs.stripe.com/payments/bancontact/set-up-payment

Instructions for adding the Stripe client library to your project across various programming languages and build tools, including Gradle, Maven, npm, Go Modules, dotnet, and NuGet. This is a prerequisite for interacting with the Stripe API from your application.

```java
/*
  For Gradle, add the following dependency to your build.gradle and replace with
  the version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
*/
implementation "com.stripe:stripe-java:30.0.0"
```

```xml
<!--
  For Maven, add the following dependency to your POM and replace with the
  version number you want to use from:
  - https://mvnrepository.com/artifact/com.stripe/stripe-java or
  - https://github.com/stripe/stripe-java/releases/latest
-->
<dependency>
  <groupId>com.stripe</groupId>
  <artifactId>stripe-java</artifactId>
  <version>30.0.0</version>
</dependency>
```

```bash
# For other environments, manually install the following JARs:
# - The Stripe JAR from https://github.com/stripe/stripe-java/releases/latest
# - Google Gson from https://github.com/google/gson
```

```bash
# Install with npm
npm install stripe --save
```

```bash
# Make sure your project is using Go Modules
go mod init
# Install stripe-go
go get -u github.com/stripe/stripe-go/v83
```

```go
// Then import the package
import (
  "github.com/stripe/stripe-go/v83"
)
```

```bash
# Install with dotnet
dotnet add package Stripe.net
dotnet restore
```

```bash
# Or install with NuGet
Install-Package Stripe.net
```